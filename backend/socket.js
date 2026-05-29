const { Server } = require('socket.io');

const { run, all, get } = require('./db/database');
const { recordLike, getUserPublic } = require('./services/matching');

// 두 유저 ID로 결정되는 1:1 채팅방 이름
// 작은 ID가 항상 앞에 와야 양쪽이 같은 방에 들어옴
function makeRoomName(userA, userB) {
  const a = Number(userA);
  const b = Number(userB);

  if (Number.isNaN(a) || Number.isNaN(b)) return null;

  const [low, high] = a < b ? [a, b] : [b, a];
  return `chat:${low}-${high}`;
}

// 어떤 유저가 어떤 socket으로 연결돼 있는지 추적 (멀티탭/멀티디바이스 대응)
const userSockets = new Map(); // userId -> Set<socketId>

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
  if (set.size === 0) userSockets.delete(userId);
}

function isUserOnline(userId) {
  const set = userSockets.get(Number(userId));
  return !!set && set.size > 0;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const rawMyId = socket.handshake.auth?.myId;
    const myId = Number(rawMyId);

    if (!myId || Number.isNaN(myId)) {
      console.warn('소켓 연결 거부: myId 없음', socket.id);
      socket.emit('error_message', { error: '로그인 정보 없음 (myId)' });
      socket.disconnect(true);
      return;
    }

    addUserSocket(myId, socket.id);

    // 본인 전용 알림 채널 (좋아요/매칭 푸시용으로 다음 단계에서 사용)
    socket.join(`user:${myId}`);

    console.log(`소켓 연결: user=${myId} sid=${socket.id}`);

    // 1:1 채팅방 입장
    socket.on('chat:join', ({ partnerId }) => {
      const room = makeRoomName(myId, partnerId);
      if (!room) return;

      socket.join(room);
      socket.emit('chat:joined', { room, partnerId: Number(partnerId) });
    });

    // 채팅방 나가기
    socket.on('chat:leave', ({ partnerId }) => {
      const room = makeRoomName(myId, partnerId);
      if (!room) return;
      socket.leave(room);
    });

    // 메시지 전송
    socket.on('chat:send', async ({ partnerId, message }, ack) => {
      try {
        const receiverId = Number(partnerId);
        const text = (message ?? '').toString().trim();

        if (!receiverId || !text) {
          if (typeof ack === 'function') {
            ack({ ok: false, error: 'partnerId 또는 message 누락' });
          }
          return;
        }

        const result = await run(
          `INSERT INTO chats (
             sender_id, receiver_id, message, created_at
           ) VALUES (?, ?, ?, datetime('now'))`,
          [myId, receiverId, text]
        );

        const saved = await get('SELECT * FROM chats WHERE id = ?', [
          result.lastID,
        ]);

        const room = makeRoomName(myId, receiverId);

        if (room) {
          // 같은 방에 있는 양쪽(또는 다른 탭) 모두에게 새 메시지 푸시
          io.to(room).emit('chat:message', saved);
        }

        // 상대가 채팅방에 안 들어와 있어도 알림으로 받게
        io.to(`user:${receiverId}`).emit('chat:notify', saved);

        if (typeof ack === 'function') {
          ack({ ok: true, message: saved });
        }
      } catch (err) {
        console.error('chat:send 실패', err);
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message });
        }
      }
    });

    // 입력 중 표시 (DB 저장 없이 상대에게만 릴레이)
    socket.on('chat:typing', ({ partnerId, isTyping }) => {
      const target = Number(partnerId);
      if (!target) return;
      io.to(`user:${target}`).emit('chat:typing', {
        fromUserId: myId,
        isTyping: !!isTyping,
      });
    });

    // 읽음 처리: 상대가 나에게 보낸 모든 미읽음 메시지에 read_at 기록
    socket.on('chat:read', async ({ partnerId }, ack) => {
      try {
        const partner = Number(partnerId);
        if (!partner) {
          if (typeof ack === 'function') ack({ ok: false, error: 'partnerId 누락' });
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

        // 메시지를 보낸 상대에게 "내가 읽었어" 알림
        io.to(`user:${partner}`).emit('chat:read:update', {
          readerId: myId,
          partnerId: myId,
          lastReadMessageId: lastRead?.id ?? null,
          readAt: lastRead?.read_at ?? null,
        });

        if (typeof ack === 'function') {
          ack({ ok: true, lastReadMessageId: lastRead?.id ?? null });
        }
      } catch (err) {
        console.error('chat:read 실패', err);
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // 좋아요 보내기 (틴더 ✓)
    // 결과는 ack로 돌려주고, 동시에 상대/본인에게 푸시 이벤트도 보냄
    socket.on('like:send', async ({ toUserId }, ack) => {
      try {
        const targetId = Number(toUserId);
        if (!targetId) {
          if (typeof ack === 'function') {
            ack({ ok: false, error: 'toUserId 누락' });
          }
          return;
        }

        const { matched, matchId } = await recordLike(myId, targetId);

        // 본인 정보 / 상대 정보 (알림 페이로드용)
        const [me, target] = await Promise.all([
          getUserPublic(myId),
          getUserPublic(targetId),
        ]);

        if (matched) {
          // 양쪽 모두에게 매칭 성사 푸시
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
          // 상대에게 "누가 좋아요 눌렀어요" 알림
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
          ack({ ok: false, error: err.message });
        }
      }
    });

    socket.on('disconnect', () => {
      removeUserSocket(myId, socket.id);
      console.log(`소켓 종료: user=${myId} sid=${socket.id}`);
    });
  });

  return io;
}

module.exports = {
  initSocket,
  isUserOnline,
  makeRoomName,
};
