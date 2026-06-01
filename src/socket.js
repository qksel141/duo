import { io } from 'socket.io-client';

import { getCurrentUserId } from './auth';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ?? '';

let socket = null;
let currentSocketUserId = null;
let chatListenersAttached = false;

// 채팅 수신 구독자
const chatIncomingHandlers = new Set();

// 페이지가 마운트되기 전에 도착한 메시지를 잃지 않기 위한 글로벌 버퍼
// chat row의 id를 키로 가짐
const recentMessageBuffer = new Map();
const RECENT_BUFFER_LIMIT = 200;

function rememberRow(row) {
  if (!row || row.id == null) return;
  if (recentMessageBuffer.size >= RECENT_BUFFER_LIMIT) {
    const firstKey = recentMessageBuffer.keys().next().value;
    recentMessageBuffer.delete(firstKey);
  }
  recentMessageBuffer.set(row.id, row);
}

export function getRecentMessages(filterFn) {
  const rows = Array.from(recentMessageBuffer.values());
  return typeof filterFn === 'function' ? rows.filter(filterFn) : rows;
}

function attachGlobalChatListeners(sock) {
  if (chatListenersAttached) return;
  chatListenersAttached = true;

  const dispatch = (row, source) => {
    rememberRow(row);
    chatIncomingHandlers.forEach((handler) => {
      try {
        handler(row, source);
      } catch (err) {
        console.warn('[socket] chat handler error', err);
      }
    });
  };

  sock.on('chat:message', (row) => dispatch(row, 'message'));
  sock.on('chat:notify', (row) => dispatch(row, 'notify'));
}

export function subscribeChatIncoming(handler) {
  chatIncomingHandlers.add(handler);
  return () => chatIncomingHandlers.delete(handler);
}

// 같은 myId로는 한 인스턴스 재사용, myId가 바뀌면 끊고 새로 연결
export function getSocket() {
  const myId = getCurrentUserId();

  if (!myId) {
    if (socket) {
      socket.disconnect();
      socket = null;
      currentSocketUserId = null;
      chatListenersAttached = false;
    }
    return null;
  }

  if (socket && currentSocketUserId !== myId) {
    socket.disconnect();
    socket = null;
    currentSocketUserId = null;
    chatListenersAttached = false;
  }

  if (!socket) {
    socket = io(SOCKET_URL || undefined, {
      auth: { myId },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    currentSocketUserId = myId;

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id, 'as user', myId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error:', err.message);
    });

    socket.on('error_message', (payload) => {
      console.warn('[socket] server error:', payload);
    });

    attachGlobalChatListeners(socket);
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function waitForSocket(timeoutMs = 5000) {
  const sock = getSocket();
  if (!sock) {
    return Promise.reject(new Error('로그인이 필요합니다.'));
  }
  if (sock.connected) {
    return Promise.resolve(sock);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      sock.off('connect', onConnect);
      reject(new Error('실시간 서버 연결 시간 초과'));
    }, timeoutMs);

    const onConnect = () => {
      clearTimeout(timer);
      resolve(sock);
    };

    sock.once('connect', onConnect);
  });
}

// 서버가 chat:joined 를 보낸 뒤에 resolve → 그 다음 메시지 전송하면 첫 메시지 누락 방지
export function joinChatRoom(partnerId, timeoutMs = 5000) {
  const targetId = Number(partnerId);
  if (!targetId) {
    return Promise.reject(new Error('상대 ID가 없습니다.'));
  }

  return waitForSocket(timeoutMs).then(
    (sock) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          sock.off('chat:joined', onJoined);
          reject(new Error('채팅방 입장 시간 초과'));
        }, timeoutMs);

        const onJoined = (payload) => {
          if (Number(payload?.partnerId) !== targetId) return;
          clearTimeout(timer);
          sock.off('chat:joined', onJoined);
          resolve(sock);
        };

        sock.on('chat:joined', onJoined);
        sock.emit('chat:join', { partnerId: targetId });
      })
  );
}

export function emitTyping(partnerId, isTyping) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('chat:typing', {
    partnerId: Number(partnerId),
    isTyping: !!isTyping,
  });
}

export function markChatRead(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return Promise.resolve();
  return new Promise((resolve) => {
    sock.emit('chat:read', { partnerId: Number(partnerId) }, (ack) => {
      resolve(ack || {});
    });
  });
}

export function emitGameRequest(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('game:request', { partnerId: Number(partnerId) });
}

export function emitGameConfirm(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('game:confirm', { partnerId: Number(partnerId) });
}

export function emitGameReject(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('game:reject', { partnerId: Number(partnerId) });
}

export function emitMatchEndRequest(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('match:end:request', { partnerId: Number(partnerId) });
}

export function emitMatchEndConfirm(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('match:end:confirm', { partnerId: Number(partnerId) });
}

export function emitMatchEndReject(partnerId) {
  const sock = getSocket();
  if (!sock || !partnerId) return;
  sock.emit('match:end:reject', { partnerId: Number(partnerId) });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentSocketUserId = null;
    chatListenersAttached = false;
    chatIncomingHandlers.clear();
    recentMessageBuffer.clear();
  }
}
