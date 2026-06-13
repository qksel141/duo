const { Server } = require('socket.io');

const { run, all, get } = require('./db/database');
const { recordLike, getUserPublic } = require('./services/matching');

// 두 유저 ID로 결정되는 1:1 채팅방 이름
function makeRoomName(userA, userB) {
  const a = Number(userA);
  const b = Number(userB);

  if (Number.isNaN(a) || Number.isNaN(b)) return null;

  const [low, high] = a < b ? [a, b] : [b, a];

  return `chat:${low}-${high}`;
}

// 어떤 유저가 어떤 socket으로 연결돼 있는지 추적
const userSockets = new Map();

function addUserSocket(userId, socketId) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const set = userSockets.get(userId);

  if (!set) return;

  set.delete(socketId);

  if (set.size === 0) {
    userSockets.delete(userId);
  }
}

function isUserOnline(userId) {
  const set = userSockets.get(Number(userId));

  return !!set && set.size > 0;
}

function getOnlineUserIds() {
  return Array.from(userSockets.keys());
}

let ioInstance = null;

function getIO() {
  return ioInstance;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    const rawMyId = socket.handshake.auth?.myId;
    const myId = Number(rawMyId);

    if (!myId || Number.isNaN(myId)) {
      console.warn('소켓 연결 거부: myId 없음', socket.id);

      socket.emit('error_message', {
        error: '로그인 정보 없음 (myId)'
      });

      socket.disconnect(true);

      return;
    }

    addUserSocket(myId, socket.id);

    socket.join(`user:${myId}`);

    socket.emit('online:users', {
      userIds: getOnlineUserIds()
    });

    io.emit('user:online', {
      userId: myId
    });

    // 클라이언트가 마운트 시점에 목록을 놓쳤을 때 다시 요청할 수 있게
    socket.on('online:request', () => {
      socket.emit('online:users', {
        userIds: getOnlineUserIds()
      });
    });

    console.log(`소켓 연결: user=${myId} sid=${socket.id}`);

    // 1:1 채팅방 입장
    socket.on('chat:join', ({ partnerId }) => {
      const room = makeRoomName(myId, partnerId);

      if (!room) return;

      socket.join(room);

      socket.emit('chat:joined', {
        room,
        partnerId: Number(partnerId)
      });
    });

    // 채팅방 나가기 (소켓 룸만 떠남)
    socket.on('chat:leave', ({ partnerId }) => {
      const room = makeRoomName(myId, partnerId);

      if (!room) return;

      socket.leave(room);
    });

    // 채팅방 완전히 나가기 (매칭 해제 + 상대에게 알림)
    socket.on('chat:exit', async ({ partnerId }, ack) => {
      try {
        const target = Number(partnerId);

        if (!target) {
          if (typeof ack === 'function') {
            ack({ ok: false, error: 'partnerId 누락' });
          }
          return;
        }

        // 좋아요 / 매칭 / 대화 내역 제거 → 메인에서 서로 다시 발견 가능
        await run(
          `DELETE FROM likes
             WHERE (from_user_id = ? AND to_user_id = ?)
                OR (from_user_id = ? AND to_user_id = ?)`,
          [myId, target, target, myId]
        );

        await run(
          `DELETE FROM matches
             WHERE (user_id = ? AND matched_user_id = ?)
                OR (user_id = ? AND matched_user_id = ?)`,
          [myId, target, target, myId]
        );

        await run(
          `DELETE FROM chats
             WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)`,
          [myId, target, target, myId]
        );

        const me = await getUserPublic(myId);

        // 상대에게 "상대가 채팅방을 나갔어요" 알림
        io.to(`user:${target}`).emit('chat:partner:left', {
          fromUserId: myId,
          fromNickname: me?.nickname ?? '상대',
        });

        if (typeof ack === 'function') {
          ack({ ok: true });
        }
      } catch (err) {
        console.error('chat:exit 실패', err);
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message });
        }
      }
    });

    // 메시지 전송
    socket.on('chat:send', async ({ partnerId, message }, ack) => {
      try {
        const receiverId = Number(partnerId);
        const text = (message ?? '').toString().trim();

        if (!receiverId || !text) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'partnerId 또는 message 누락'
            });
          }

          return;
        }

        const result = await run(
          `INSERT INTO chats (
             sender_id, receiver_id, message, created_at
           ) VALUES (?, ?, ?, datetime('now'))`,
          [myId, receiverId, text]
        );

        const saved = await get(
          'SELECT * FROM chats WHERE id = ?',
          [result.lastID]
        );

        const room = makeRoomName(myId, receiverId);

        if (room) {
          io.to(room).emit('chat:message', saved);
        }

        io.to(`user:${receiverId}`).emit('chat:notify', saved);

        if (typeof ack === 'function') {
          ack({
            ok: true,
            message: saved
          });
        }
      } catch (err) {
        console.error('chat:send 실패', err);

        if (typeof ack === 'function') {
          ack({
            ok: false,
            error: err.message
          });
        }
      }
    });

    // 입력 중 표시
    socket.on('chat:typing', ({ partnerId, isTyping }) => {
      const target = Number(partnerId);

      if (!target) return;

      io.to(`user:${target}`).emit('chat:typing', {
        fromUserId: myId,
        isTyping: !!isTyping,
      });
    });

    // 읽음 처리
    socket.on('chat:read', async ({ partnerId }, ack) => {
      try {
        const partner = Number(partnerId);

        if (!partner) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'partnerId 누락'
            });
          }

          return;
        }

        await run(
          `UPDATE chats
             SET read_at = datetime('now')
             WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
          [partner, myId]
        );

        const lastRead = await get(
          `SELECT id, read_at FROM chats
             WHERE sender_id = ? AND receiver_id = ?
             ORDER BY id DESC LIMIT 1`,
          [partner, myId]
        );

        io.to(`user:${partner}`).emit('chat:read:update', {
          readerId: myId,
          partnerId: myId,
          lastReadMessageId: lastRead?.id ?? null,
          readAt: lastRead?.read_at ?? null,
        });

        if (typeof ack === 'function') {
          ack({
            ok: true,
            lastReadMessageId: lastRead?.id ?? null
          });
        }
      } catch (err) {
        console.error('chat:read 실패', err);

        if (typeof ack === 'function') {
          ack({
            ok: false,
            error: err.message
          });
        }
      }
    });

    // 게임 시작 / 매칭 종료 — 한 명이 요청하면 상대에게 요청 푸시,
    // 상대가 수락(confirm)을 보내면 양쪽에 confirmed 푸시
    socket.on('game:request', ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;
      io.to(`user:${target}`).emit('game:request', {
        fromUserId: myId,
      });
    });

    socket.on('game:confirm', ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;
      const payload = { partnerA: myId, partnerB: target };
      io.to(`user:${myId}`).emit('game:confirmed', payload);
      io.to(`user:${target}`).emit('game:confirmed', payload);
    });

    socket.on('game:reject', ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;
      io.to(`user:${target}`).emit('game:rejected', {
        fromUserId: myId,
      });
    });

    socket.on('match:end:request', ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;
      io.to(`user:${target}`).emit('match:end:request', {
        fromUserId: myId,
      });
    });

    socket.on('match:end:confirm', async ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;

      // 양쪽 모두에게 종료 푸시 + matchId 조회해서 함께 보냄
      const matchRow = await get(
        `SELECT id FROM matches
           WHERE (user_id = ? AND matched_user_id = ?)
              OR (user_id = ? AND matched_user_id = ?)`,
        [myId, target, target, myId]
      );

      const payload = {
        partnerA: myId,
        partnerB: target,
        matchId: matchRow?.id ?? null,
      };

      io.to(`user:${myId}`).emit('match:ended', payload);
      io.to(`user:${target}`).emit('match:ended', payload);
    });

    socket.on('match:end:reject', ({ partnerId }) => {
      const target = Number(partnerId);
      if (!target) return;
      io.to(`user:${target}`).emit('match:end:rejected', {
        fromUserId: myId,
      });
    });

    // 좋아요 보내기
    socket.on('like:send', async ({ toUserId }, ack) => {
      try {
        const targetId = Number(toUserId);

        if (!targetId) {
          if (typeof ack === 'function') {
            ack({
              ok: false,
              error: 'toUserId 누락'
            });
          }

          return;
        }

        const { matched, matchId } = await recordLike(myId, targetId);

        const [me, target] = await Promise.all([
          getUserPublic(myId),
          getUserPublic(targetId),
        ]);

        if (matched) {
          const matchPayload = {
            matchId,
            matchedAt: new Date().toISOString(),
          };

          io.to(`user:${myId}`).emit('match:made', {
            ...matchPayload,
            partner: target,
          });

          io.to(`user:${targetId}`).emit('match:made', {
            ...matchPayload,
            partner: me,
          });
        } else {
          io.to(`user:${targetId}`).emit('like:received', {
            from: me,
            createdAt: new Date().toISOString(),
          });
        }

        if (typeof ack === 'function') {
          ack({
            ok: true,
            matched,
            matchId,
            partner: target,
          });
        }
      } catch (err) {
        console.error('like:send 실패', err);

        if (typeof ack === 'function') {
          ack({
            ok: false,
            error: err.message
          });
        }
      }
    });

    socket.on('disconnect', () => {
      removeUserSocket(myId, socket.id);

      if (!isUserOnline(myId)) {
        io.emit('user:offline', {
          userId: myId
        });
      }

      console.log(`소켓 종료: user=${myId} sid=${socket.id}`);
    });
  });

  return io;
}

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  getOnlineUserIds,
  makeRoomName,
};