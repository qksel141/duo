import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Gamepad2, Flag, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getCurrentUserId } from '../auth';
import {
  joinChatRoom,
  subscribeChatIncoming,
  waitForSocket,
  markChatRead,
  emitTyping,
  getSocket,
} from '../socket';
import { fetchChatHistory } from '../api/users';

// 서버에서 받은 chats row를 화면용 message 객체로 변환
function rowToMessage(row, myId) {
  return {
    id: `db-${row.id}`,
    dbId: row.id,
    sender: Number(row.sender_id) === Number(myId) ? 'me' : 'other',
    text: row.message,
    createdAt: row.created_at,
    readAt: row.read_at || null,
  };
}

// 시스템(게임 시작/종료 등) 메시지는 DB에 저장하지 않고 클라이언트 임시 ID로만 표시
function makeLocalSystemMessage(text) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender: 'system',
    text,
  };
}

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const myId = getCurrentUserId();

  const [matchedUser, setMatchedUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isEndedChat, setIsEndedChat] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  // 중복 수신 방지 (서버가 같은 메시지를 두 번 보내는 케이스 가드)
  const seenMessageIdsRef = useRef(new Set());

  // pendingId 충돌 방지용 카운터
  const pendingCounterRef = useRef(0);

  const restartReplies = [
    '님이랑 하는게 재밌긴해요',
    '좋아요 한 판 더 하죠!',
    '이번엔 제가 더 잘해볼게요 ㅋㅋ',
    '콜 좋아요 바로 갑시다',
    '님 못해서 하기시러요',
  ];

  const getChatUserId = () => {
    const raw = matchedUser?.userId ?? matchedUser?.id;
    return raw != null ? Number(raw) : null;
  };

  const partnerIdRef = useRef(null);
  const roomReadyRef = useRef(false);

  const [partnerTyping, setPartnerTyping] = useState(false);
  const lastTypingSentRef = useRef(0);
  const typingStopTimerRef = useRef(null);
  const partnerTypingClearTimerRef = useRef(null);

  // 입력 변화 → 상대에게 typing 신호 (2초 쓰로틀, 2.5초 무입력 시 stop)
  const handleInputChange = (e) => {
    setInput(e.target.value);

    const partnerId = partnerIdRef.current;
    if (!partnerId) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      emitTyping(partnerId, true);
      lastTypingSentRef.current = now;
    }

    clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      emitTyping(partnerId, false);
      lastTypingSentRef.current = 0;
    }, 2500);
  };

  const stopMyTyping = () => {
    const partnerId = partnerIdRef.current;
    if (!partnerId) return;
    clearTimeout(typingStopTimerRef.current);
    if (lastTypingSentRef.current > 0) {
      emitTyping(partnerId, false);
      lastTypingSentRef.current = 0;
    }
  };

  const sortMessages = (list) => {
    return [...list].sort((a, b) => {
      const aDb = String(a.id).startsWith('db-')
        ? Number(String(a.id).replace('db-', ''))
        : Infinity;
      const bDb = String(b.id).startsWith('db-')
        ? Number(String(b.id).replace('db-', ''))
        : Infinity;
      if (aDb !== bDb) return aDb - bDb;
      return String(a.id).localeCompare(String(b.id));
    });
  };

  const upsertMessage = (msg) => {
    setMessages((prev) => {
      const map = new Map();
      prev.forEach((m) => map.set(m.id, m));

      // DB 확정 메시지가 오면 같은 내용의 pending 제거
      if (String(msg.id).startsWith('db-')) {
        map.forEach((m, key) => {
          if (
            String(key).startsWith('pending-') &&
            m.sender === msg.sender &&
            m.text === msg.text
          ) {
            map.delete(key);
          }
        });
        seenMessageIdsRef.current.add(msg.id);
      }

      map.set(msg.id, msg);
      return sortMessages(Array.from(map.values()));
    });
  };

  const mergeHistoryRows = (rows) => {
    const fromServer = rows.map((row) => rowToMessage(row, myId));
    fromServer.forEach((m) => seenMessageIdsRef.current.add(m.id));

    setMessages((prev) => {
      const map = new Map();
      prev.forEach((m) => map.set(m.id, m));
      fromServer.forEach((m) => map.set(m.id, m));

      const confirmedTexts = new Set(
        fromServer.filter((m) => m.sender === 'me').map((m) => m.text)
      );
      const result = [];
      map.forEach((m) => {
        if (
          String(m.id).startsWith('pending-') &&
          m.sender === 'me' &&
          confirmedTexts.has(m.text)
        ) {
          return;
        }
        result.push(m);
      });

      return sortMessages(result);
    });
  };

  const syncHistoryFromServer = async (partnerId) => {
    if (!myId || !partnerId) return;
    try {
      const rows = await fetchChatHistory(myId, partnerId);
      mergeHistoryRows(rows);
    } catch (err) {
      console.warn('히스토리 동기화 실패', err);
    }
  };

  const saveActiveChatMeta = (started = gameStarted) => {
    if (!matchedUser) return;

    const chatUserId = getChatUserId();

    const activeChats =
      JSON.parse(sessionStorage.getItem('activeChats')) || [];

    const activeChat = {
      id: matchedUser.chatId || Date.now(),
      userId: chatUserId,
      name: matchedUser.name,
      tag: matchedUser.tag || 'KR1',
      img: matchedUser.img,
      createdAt:
        matchedUser.createdAt || new Date().toLocaleString('ko-KR'),
      gameStarted: started,
    };

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    sessionStorage.setItem(
      'activeChats',
      JSON.stringify([activeChat, ...updatedActiveChats])
    );

    sessionStorage.setItem(
      'currentMatch',
      JSON.stringify({
        id: chatUserId,
        userId: chatUserId,
        name: matchedUser.name,
        tag: matchedUser.tag || 'KR1',
        img: matchedUser.img,
        chatId: activeChat.id,
        createdAt: activeChat.createdAt,
      })
    );
  };

  // 로그인 가드: myId 없으면 로그인으로
  useEffect(() => {
    if (!myId) {
      navigate('/login', { replace: true });
    }
  }, [myId, navigate]);

  // 상대 결정 + 게임 상태 복원 (메시지는 DB에서 로드하므로 sessionStorage messages는 안 씀)
  useEffect(() => {
    if (!myId) return;

    const currentMatch =
      JSON.parse(sessionStorage.getItem('currentMatch'));

    const selectedChat =
      JSON.parse(sessionStorage.getItem('selectedChat'));

    const activeChats =
      JSON.parse(sessionStorage.getItem('activeChats')) || [];

    if (currentMatch) {
      const activeChat = activeChats.find(
        (chat) =>
          Number(chat.userId) === Number(currentMatch.userId || currentMatch.id)
      );

      setMatchedUser(currentMatch);
      setIsEndedChat(false);
      setGameStarted(activeChat?.gameStarted || false);

      sessionStorage.removeItem('selectedChat');
      return;
    }

    if (selectedChat) {
      const selectedUserId = selectedChat.userId || selectedChat.id;

      const activeChat = activeChats.find(
        (chat) => Number(chat.userId) === Number(selectedUserId)
      );

      if (activeChat) {
        setMatchedUser(activeChat);
        setGameStarted(activeChat.gameStarted || false);
        setIsEndedChat(false);

        sessionStorage.setItem(
          'currentMatch',
          JSON.stringify(activeChat)
        );

        sessionStorage.removeItem('selectedChat');
        return;
      }

      setMatchedUser(selectedChat);
      setIsEndedChat(true);
      setGameStarted(false);
      return;
    }

    navigate('/my-chats', { replace: true });
  }, [navigate, myId]);

  // 채팅 히스토리 로드 + 소켓 룸 입장 + 실시간 수신
  useEffect(() => {
    if (!myId || !matchedUser) return;

    const partnerId = getChatUserId();
    if (!partnerId) return;

    partnerIdRef.current = partnerId;

    let cancelled = false;

    seenMessageIdsRef.current = new Set();
    setHistoryLoading(true);
    setHistoryError(null);

    (async () => {
      try {
        const rows = await fetchChatHistory(myId, partnerId);
        if (cancelled) return;
        mergeHistoryRows(rows);
      } catch (err) {
        if (cancelled) return;
        setHistoryError(err.message || '채팅 내역을 불러오지 못했습니다.');
        setMessages([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    roomReadyRef.current = false;

    // 채팅방 입장 완료 후 히스토리 동기화 + 읽음 처리
    joinChatRoom(partnerId)
      .then(async () => {
        if (cancelled) return;
        roomReadyRef.current = true;
        await syncHistoryFromServer(partnerId);
        if (!cancelled) markChatRead(partnerId);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('채팅방 입장 실패', err);
      });

    // 안전망: 2초 뒤 한 번 더 DB 동기화 (첫 메시지 누락 복구)
    const syncTimer = setTimeout(
      () => !cancelled && syncHistoryFromServer(partnerId),
      2000
    );

    const isRowForThisChat = (row) => {
      const me = Number(myId);
      const partner = Number(partnerIdRef.current);
      if (!partner) return false;

      const sid = Number(row.sender_id);
      const rid = Number(row.receiver_id);

      return (
        (sid === me && rid === partner) ||
        (sid === partner && rid === me)
      );
    };

    const handleIncoming = (row, source) => {
      // 채팅 화면에서는 chat:message 만 사용 (notify는 토스트용 → 중복 표시 방지)
      if (source === 'notify') return;
      if (!isRowForThisChat(row)) return;
      upsertMessage(rowToMessage(row, myId));

      // 상대가 보낸 메시지 수신 → 즉시 읽음 처리 + 입력 중 표시 해제
      if (Number(row.sender_id) === Number(partnerIdRef.current)) {
        markChatRead(partnerIdRef.current);
        setPartnerTyping(false);
        clearTimeout(partnerTypingClearTimerRef.current);
      }
    };

    // 상대가 내 메시지를 읽었을 때 - 내가 보낸 메시지들의 readAt 갱신
    const sock = getSocket();
    const handleReadUpdate = ({ readerId, lastReadMessageId }) => {
      if (Number(readerId) !== Number(partnerIdRef.current)) return;
      if (!lastReadMessageId) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender !== 'me') return m;
          if (typeof m.dbId !== 'number') return m;
          if (m.dbId > lastReadMessageId) return m;
          if (m.readAt) return m;
          return { ...m, readAt: new Date().toISOString() };
        })
      );
    };
    if (sock) sock.on('chat:read:update', handleReadUpdate);

    // 상대가 입력 중 표시
    const handlePartnerTyping = ({ fromUserId, isTyping }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setPartnerTyping(!!isTyping);

      clearTimeout(partnerTypingClearTimerRef.current);
      if (isTyping) {
        // 4초 동안 다음 typing이 안 오면 자동 종료 (안전장치)
        partnerTypingClearTimerRef.current = setTimeout(() => {
          setPartnerTyping(false);
        }, 4000);
      }
    };
    if (sock) sock.on('chat:typing', handlePartnerTyping);

    // 전역 소켓 리스너
    const unsubscribe = subscribeChatIncoming(handleIncoming);

    return () => {
      cancelled = true;
      roomReadyRef.current = false;
      clearTimeout(syncTimer);
      clearTimeout(partnerTypingClearTimerRef.current);
      clearTimeout(typingStopTimerRef.current);
      unsubscribe();
      if (sock) {
        sock.off('chat:read:update', handleReadUpdate);
        sock.off('chat:typing', handlePartnerTyping);
      }
      // chat:leave 는 호출하지 않음 (cleanup 직후 재마운트 시 첫 메시지 유실 방지)
    };
  }, [myId, matchedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, partnerTyping]);

  const removeThisChatEverywhere = () => {
    const chatUserId = getChatUserId();

    const activeChats =
      JSON.parse(sessionStorage.getItem('activeChats')) || [];

    const chatHistory =
      JSON.parse(sessionStorage.getItem('chatHistory')) || [];

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    const updatedChatHistory = chatHistory.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    sessionStorage.setItem(
      'activeChats',
      JSON.stringify(updatedActiveChats)
    );

    sessionStorage.setItem(
      'chatHistory',
      JSON.stringify(updatedChatHistory)
    );

    sessionStorage.removeItem('currentMatch');
    sessionStorage.removeItem('selectedChat');
  };

  const handleBack = () => {
    sessionStorage.removeItem('selectedChat');

    if (!isEndedChat && matchedUser) {
      saveActiveChatMeta(gameStarted);
    }

    if (isEndedChat) {
      navigate('/my-chats', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (isEndedChat || isExploding) return;
    if (!matchedUser) return;

    const partnerId = getChatUserId();
    if (!partnerId) return;

    const text = input.trim();
    setInput('');
    stopMyTyping();

    pendingCounterRef.current += 1;
    const pendingId = `pending-${Date.now()}-${pendingCounterRef.current}`;

    // 전송 직후 내 화면에 바로 표시 (낙관적 업데이트)
    upsertMessage({ id: pendingId, sender: 'me', text, pending: true });

    const markFailed = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, pending: false, failed: true }
            : m
        )
      );
    };

    const replaceWithConfirmed = (row) => {
      setMessages((prev) => prev.filter((m) => m.id !== pendingId));
      upsertMessage(rowToMessage(row, myId));
    };

    try {
      // 입장 완료(chat:joined) 후 전송 — 첫 메시지가 상대에게 안 보이던 문제 해결
      const socket = await joinChatRoom(partnerId);
      roomReadyRef.current = true;

      // 응답이 일정 시간 안 오면 실패로 표시
      let ackReceived = false;
      const timer = setTimeout(() => {
        if (!ackReceived) {
          markFailed();
          setHistoryError('서버 응답 지연 — 메시지를 다시 보내주세요.');
        }
      }, 5000);

      socket.emit(
        'chat:send',
        { partnerId, message: text },
        (ack) => {
          ackReceived = true;
          clearTimeout(timer);

          if (!ack) {
            markFailed();
            setHistoryError('서버 응답이 없습니다.');
            return;
          }
          if (ack.ok === false) {
            markFailed();
            setHistoryError(`메시지 전송 실패: ${ack.error}`);
            return;
          }
          if (ack.message) {
            setHistoryError(null);
            replaceWithConfirmed(ack.message);
          }
        }
      );

      saveActiveChatMeta(gameStarted);
    } catch (err) {
      markFailed();
      setHistoryError(err.message || '실시간 연결이 끊겼습니다.');
    }
  };

  const handleStartGame = () => {
    if (isEndedChat || isExploding) return;
    if (gameStarted) return;

    setGameStarted(true);
    upsertMessage(
      makeLocalSystemMessage(
        '게임이 시작되었습니다. 플레이 후 매칭을 종료할 수 있어요.'
      )
    );
    saveActiveChatMeta(true);
  };

  const handleRestartMatch = () => {
    if (!matchedUser || isExploding) return;

    const randomReply =
      restartReplies[Math.floor(Math.random() * restartReplies.length)];

    const isRejected = randomReply === '님 못해서 하기시러요';

    upsertMessage({
      id: `local-${Date.now()}-req`,
      sender: 'me',
      text: '혹시 다시 한 판 하실래요?',
    });

    upsertMessage({
      id: `local-${Date.now()}-reply`,
      sender: 'other',
      text: randomReply,
    });

    upsertMessage(
      makeLocalSystemMessage(
        isRejected
          ? '상대방이 다시 게임하기를 거절했습니다. 채팅방이 삭제됩니다.'
          : '다시 게임 요청이 수락되었습니다. 게임 시작 버튼을 눌러 진행해 보세요.'
      )
    );

    if (isRejected) {
      setTimeout(() => {
        setIsExploding(true);
      }, 700);

      setTimeout(() => {
        removeThisChatEverywhere();
        navigate('/my-chats', { replace: true });
      }, 1900);

      return;
    }

    setIsEndedChat(false);
    setGameStarted(false);

    const existingChatHistory =
      JSON.parse(sessionStorage.getItem('chatHistory')) || [];

    const chatUserId = getChatUserId();

    const updatedChatHistory = existingChatHistory.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    sessionStorage.setItem(
      'chatHistory',
      JSON.stringify(updatedChatHistory)
    );

    sessionStorage.setItem(
      'currentMatch',
      JSON.stringify({
        id: chatUserId,
        userId: chatUserId,
        name: matchedUser.name,
        tag: matchedUser.tag || 'KR1',
        img: matchedUser.img,
      })
    );

    sessionStorage.removeItem('selectedChat');

    setTimeout(() => {
      saveActiveChatMeta(false);
    }, 0);
  };

  const handleEndMatch = () => {
    if (!matchedUser) return;

    if (!gameStarted) {
      alert('게임 시작 후 매칭을 종료할 수 있습니다.');
      return;
    }

    const existingChatHistory =
      JSON.parse(sessionStorage.getItem('chatHistory')) || [];

    const activeChats =
      JSON.parse(sessionStorage.getItem('activeChats')) || [];

    const chatUserId = getChatUserId();

    upsertMessage(makeLocalSystemMessage('매칭이 종료되었습니다.'));

    const newChat = {
      id: Date.now(),
      userId: chatUserId,
      name: matchedUser.name,
      tag: matchedUser.tag || 'KR1',
      img: matchedUser.img,
      endedAt: new Date().toLocaleString('ko-KR'),
      gameStarted: false,
    };

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    const alreadySaved = existingChatHistory.some(
      (chat) => Number(chat.userId) === Number(chatUserId)
    );

    const nextChatHistory = alreadySaved
      ? existingChatHistory.map((chat) =>
          Number(chat.userId) === Number(chatUserId) ? newChat : chat
        )
      : [newChat, ...existingChatHistory];

    sessionStorage.setItem(
      'activeChats',
      JSON.stringify(updatedActiveChats)
    );

    sessionStorage.setItem(
      'chatHistory',
      JSON.stringify(nextChatHistory)
    );

    sessionStorage.removeItem('currentMatch');
    sessionStorage.removeItem('selectedChat');

    alert('게임은 즐거우셨나요? 상대에게 별점을 남겨주세요!.');

    navigate('/my-chats', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">

      <style>{`
        @keyframes chat-explode {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          40% {
            transform: scale(1.04) rotate(1deg);
            opacity: 1;
            filter: blur(1px);
          }
          100% {
            transform: scale(0.2) rotate(12deg) translateY(-120px);
            opacity: 0;
            filter: blur(18px);
          }
        }

        @keyframes danger-flash {
          0% { opacity: 0; }
          40% { opacity: 0.6; }
          100% { opacity: 0; }
        }

        .chat-exploding {
          animation: chat-explode 1.2s ease-in forwards;
        }

        .danger-flash {
          animation: danger-flash 1.2s ease-in forwards;
        }
      `}</style>

      {isExploding && (
        <div className="fixed inset-0 z-[90] bg-red-600/30 danger-flash pointer-events-none" />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      <div
        className={
          isExploding
            ? 'chat-exploding flex flex-col flex-1 relative z-10'
            : 'flex flex-col flex-1 relative z-10'
        }
      >

        <header className="
          h-20 border-b border-white/10
          flex items-center justify-between
          px-8
          backdrop-blur-xl
          bg-black/20
        ">

          <div className="flex items-center gap-4">

            <button
              onClick={handleBack}
              disabled={isExploding}
              className="
                p-2 rounded-full
                hover:bg-white/10
                transition-all
                disabled:opacity-30
              "
            >
              <ArrowLeft size={24} />
            </button>

            {matchedUser && (
              <>
                <img
                  src={matchedUser.img}
                  alt={matchedUser.name}
                  className="
                    w-12 h-12 rounded-full
                    object-cover
                    border border-violet-500/40
                  "
                />

                <div>
                  <h2 className="text-lg font-black">
                    {matchedUser.name}
                  </h2>

                  <p className="text-sm text-stone-400">
                    {isExploding
                      ? '채팅방 삭제 중...'
                      : isEndedChat
                        ? '종료된 채팅방'
                        : gameStarted
                          ? '게임 진행 중'
                          : '듀오 채팅방'}
                  </p>
                </div>
              </>
            )}

          </div>

        </header>

        <main className="
          flex-1 overflow-y-auto
          max-w-4xl w-full mx-auto
          px-6 py-8
          space-y-4
        ">

          {historyLoading && (
            <div className="text-center text-stone-500 text-sm">
              채팅 내역 불러오는 중...
            </div>
          )}

          {!historyLoading && historyError && (
            <div className="
              text-center text-red-400 text-sm
              bg-red-500/10 border border-red-500/30
              rounded-2xl py-3 px-4
            ">
              {historyError}
            </div>
          )}

          {!historyLoading && !historyError && messages.length === 0 && (
            <div className="text-center text-stone-500 text-sm">
              아직 주고받은 메시지가 없습니다. 먼저 인사를 보내보세요!
            </div>
          )}

          {(() => {
            // 인스타 DM처럼: 내가 보낸 메시지 중 읽힌 마지막 메시지에만 "읽음" 표시
            let lastReadByPartnerId = null;
            for (let i = messages.length - 1; i >= 0; i -= 1) {
              const m = messages[i];
              if (m.sender === 'me' && m.readAt) {
                lastReadByPartnerId = m.id;
                break;
              }
            }

            return messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`
                    flex
                    ${msg.sender === 'me'
                      ? 'justify-end'
                      : msg.sender === 'system'
                        ? 'justify-center'
                        : 'justify-start'}
                  `}
                >

                  <div
                    className={`
                      max-w-[70%]
                      px-5 py-3 rounded-2xl
                      text-sm font-medium
                      ${msg.sender === 'me'
                        ? msg.failed
                          ? 'bg-red-600/40 text-white border border-red-500/40'
                          : `bg-violet-600 text-white ${msg.pending ? 'opacity-70' : ''}`
                        : msg.sender === 'system'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                          : 'bg-white/10 text-stone-200 border border-white/10'}
                    `}
                  >
                    {msg.text}
                    {msg.failed && (
                      <span className="ml-2 text-[10px] font-bold text-red-200">
                        전송 실패
                      </span>
                    )}
                  </div>

                </div>

                {msg.id === lastReadByPartnerId && (
                  <div className="flex justify-end mt-1 mr-1">
                    <span className="text-[10px] text-stone-500 font-medium">
                      읽음
                    </span>
                  </div>
                )}
              </div>
            ));
          })()}

          {partnerTyping && !isEndedChat && (
            <div className="flex justify-start">
              <div className="
                bg-white/10 border border-white/10
                px-4 py-3 rounded-2xl
                flex items-center gap-1
              ">
                <span className="typing-dot" style={{ animationDelay: '0s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          )}

          <style>{`
            @keyframes typing-bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
              40% { transform: translateY(-4px); opacity: 1; }
            }
            .typing-dot {
              display: inline-block;
              width: 6px;
              height: 6px;
              border-radius: 9999px;
              background-color: rgb(216 180 254);
              animation: typing-bounce 1s infinite ease-in-out;
            }
          `}</style>

          <div ref={bottomRef} />

        </main>

        <footer className="
          border-t border-white/10
          bg-black/30
          backdrop-blur-xl
          px-6 py-4
        ">

          <div className="max-w-4xl mx-auto space-y-3">

            {isEndedChat ? (
              <button
                onClick={handleRestartMatch}
                disabled={isExploding}
                className="
                  w-full py-4 rounded-2xl
                  bg-violet-600 hover:bg-violet-500
                  font-black
                  flex items-center justify-center gap-2
                  transition-all
                  shadow-[0_0_30px_rgba(124,58,237,0.35)]
                  disabled:opacity-40
                "
              >
                <RotateCcw size={18} />
                다시 게임하기
              </button>
            ) : (
              <div className="flex gap-3">

                <button
                  onClick={handleStartGame}
                  disabled={gameStarted || isExploding}
                  className={`
                    flex-1 py-3 rounded-2xl
                    font-bold
                    flex items-center justify-center gap-2
                    transition-all
                    ${gameStarted
                      ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
                  `}
                >
                  <Gamepad2 size={18} />

                  {gameStarted
                    ? '게임 진행 중'
                    : '게임 시작'}
                </button>

                <button
                  onClick={handleEndMatch}
                  disabled={isExploding}
                  className={`
                    flex-1 py-3 rounded-2xl
                    font-bold
                    flex items-center justify-center gap-2
                    transition-all
                    ${gameStarted
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'}
                  `}
                >
                  <Flag size={18} />
                  매칭 종료
                </button>

              </div>
            )}

            {!gameStarted && !isEndedChat && (
              <p className="text-xs text-stone-500 text-center">
                게임 시작 후 매칭 종료가 가능합니다.
              </p>
            )}

            <div className="flex gap-3">

              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={isEndedChat || isExploding}
                placeholder={
                  isEndedChat
                    ? '종료된 채팅방에서는 메시지를 보낼 수 없습니다.'
                    : '메시지를 입력하세요...'
                }
                className={`
                  flex-1 h-14 rounded-2xl
                  bg-white/5
                  border border-white/10
                  px-5
                  outline-none
                  focus:border-violet-500
                  ${isEndedChat || isExploding
                    ? 'text-stone-500 cursor-not-allowed'
                    : 'text-white'}
                `}
              />

              <button
                onClick={handleSend}
                disabled={isEndedChat || isExploding}
                className={`
                  w-14 h-14 rounded-2xl
                  flex items-center justify-center
                  ${isEndedChat || isExploding
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'}
                `}
              >
                <Send size={20} />
              </button>

            </div>

          </div>

        </footer>

      </div>

    </div>
  );
}
