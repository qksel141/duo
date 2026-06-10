import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Send, Gamepad2, Flag, RotateCcw,
  Home as HomeIcon, MessageCircle, User as UserIcon,
  Shield, Star, X, Check, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getCurrentUserId, getCurrentUser } from '../auth';
import { getTierBadgeClass, getTierShortLabel } from '../utils/tier';
import {
  joinChatRoom,
  subscribeChatIncoming,
  markChatRead,
  emitTyping,
  emitGameRequest,
  emitGameConfirm,
  emitGameReject,
  emitMatchEndRequest,
  emitMatchEndConfirm,
  emitMatchEndReject,
  emitChatExit,
  subscribePartnerLeft,
  getSocket,
} from '../socket';
import { fetchChatHistory, createRating, submitReport, createMatchHistory, fetchUserById } from '../api/users';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

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

function makeLocalSystemMessage(text) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender: 'system',
    text,
  };
}

const SUGGESTED_MESSAGES = [
  '안녕하세요! 같이 듀오 하실까요?',
  '주 포지션이 어떻게 되세요?',
  '마이크 가능하세요?',
  '몇 판 정도 같이 해볼까요?',
];

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const myId = getCurrentUserId();

  const [matchedUser, setMatchedUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isEndedChat, setIsEndedChat] = useState(false);
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  // 게임시작/매칭종료 양쪽 동의용 모달 상태
  const [incomingRequest, setIncomingRequest] = useState(null); // {type:'game'|'end'}
  const [outgoingRequest, setOutgoingRequest] = useState(null); // {type:'game'|'end'}

  // 별점 모달
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingBadge, setRatingBadge] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState(null);
  const [ratingMatchId, setRatingMatchId] = useState(null);

  // 신고 모달
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // 채팅방 나가기 확인 모달
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  // 상대 프로필 액션 메뉴 / 상세 보기
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileIsSelf, setProfileIsSelf] = useState(false); // 내 프로필 보기 여부

  const myAvatar = getCurrentUser()?.profile_image || DEFAULT_AVATAR;

  const seenMessageIdsRef = useRef(new Set());
  const pendingCounterRef = useRef(0);

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
      ownerId: myId,
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
        ownerId: myId,
      })
    );
  };

  // 로그인 가드
  useEffect(() => {
    if (!myId) {
      navigate('/login', { replace: true });
    }
  }, [myId, navigate]);

  // 상대 결정 — 다른 유저의 캐시가 남아있으면 무시 (#2, #3 픽스)
  useEffect(() => {
    if (!myId) return;

    const safeJsonGet = (key) => {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const isValidForMe = (entry) => {
      if (!entry) return false;
      const partner = Number(entry.userId ?? entry.id);
      if (!partner || partner === Number(myId)) return false;
      if (entry.ownerId != null && Number(entry.ownerId) !== Number(myId)) {
        return false;
      }
      return true;
    };

    const currentMatch = safeJsonGet('currentMatch');
    const selectedChat = safeJsonGet('selectedChat');
    const activeChats = safeJsonGet('activeChats') || [];

    if (!isValidForMe(currentMatch)) {
      sessionStorage.removeItem('currentMatch');
    }
    if (!isValidForMe(selectedChat)) {
      sessionStorage.removeItem('selectedChat');
    }

    const validCurrent = isValidForMe(currentMatch) ? currentMatch : null;
    const validSelected = isValidForMe(selectedChat) ? selectedChat : null;

    if (validCurrent) {
      const partnerId = Number(validCurrent.userId ?? validCurrent.id);
      const activeChat = activeChats.find(
        (chat) => Number(chat.userId) === partnerId &&
                  (chat.ownerId == null || Number(chat.ownerId) === Number(myId))
      );

      setMatchedUser(validCurrent);
      setIsEndedChat(false);
      setGameStarted(activeChat?.gameStarted || false);

      sessionStorage.removeItem('selectedChat');
      return;
    }

    if (validSelected) {
      const partnerId = Number(validSelected.userId ?? validSelected.id);

      const activeChat = activeChats.find(
        (chat) => Number(chat.userId) === partnerId &&
                  (chat.ownerId == null || Number(chat.ownerId) === Number(myId))
      );

      if (activeChat) {
        setMatchedUser({ ...activeChat });
        setGameStarted(activeChat.gameStarted || false);
        setIsEndedChat(false);

        sessionStorage.setItem(
          'currentMatch',
          JSON.stringify({ ...activeChat, ownerId: myId })
        );

        sessionStorage.removeItem('selectedChat');
        return;
      }

      setMatchedUser(validSelected);
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
    setPartnerLeft(false);
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
      if (source === 'notify') return;
      if (!isRowForThisChat(row)) return;
      upsertMessage(rowToMessage(row, myId));

      if (Number(row.sender_id) === Number(partnerIdRef.current)) {
        markChatRead(partnerIdRef.current);
        setPartnerTyping(false);
        clearTimeout(partnerTypingClearTimerRef.current);
      }
    };

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

    const handlePartnerTyping = ({ fromUserId, isTyping }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setPartnerTyping(!!isTyping);

      clearTimeout(partnerTypingClearTimerRef.current);
      if (isTyping) {
        partnerTypingClearTimerRef.current = setTimeout(() => {
          setPartnerTyping(false);
        }, 4000);
      }
    };
    if (sock) sock.on('chat:typing', handlePartnerTyping);

    // 양쪽 동의 게임 시작 / 매칭 종료
    const handleGameRequest = ({ fromUserId }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setIncomingRequest({ type: 'game' });
    };

    const handleGameConfirmed = ({ partnerA, partnerB }) => {
      const partner = Number(partnerIdRef.current);
      const me = Number(myId);
      const involved =
        (Number(partnerA) === me && Number(partnerB) === partner) ||
        (Number(partnerA) === partner && Number(partnerB) === me);
      if (!involved) return;

      setGameStarted(true);
      setOutgoingRequest(null);
      setIncomingRequest(null);
      upsertMessage(makeLocalSystemMessage('게임이 시작되었습니다.'));
      saveActiveChatMeta(true);
    };

    const handleGameRejected = ({ fromUserId }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setOutgoingRequest(null);
      upsertMessage(makeLocalSystemMessage('상대방이 게임 시작을 거절했습니다.'));
    };

    const handleEndRequest = ({ fromUserId }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setIncomingRequest({ type: 'end' });
    };

    const handleMatchEnded = async ({ partnerA, partnerB, matchId }) => { // ✨ async 추가!
      const partner = Number(partnerIdRef.current);
      const me = Number(myId);
      const involved =
        (Number(partnerA) === me && Number(partnerB) === partner) ||
        (Number(partnerA) === partner && Number(partnerB) === me);
      if (!involved) return;

      setOutgoingRequest(null);
      setIncomingRequest(null);
      setGameStarted(false);
      setIsEndedChat(true);
      upsertMessage(makeLocalSystemMessage('매칭이 종료되었습니다. 상대에게 별점을 남겨주세요.'));
      setRatingMatchId(matchId || null);
      setRatingOpen(true);

      // ✨ 아래부터 새로 추가! (백엔드로 매칭 히스토리 기록 전송)
      try {
        await createMatchHistory({
          user_id: me,
          matched_user_id: partner
        });
      } catch (err) {
        console.error("매칭 히스토리 백엔드 보고 실패:", err);
      }
      // ✨ 여기까지 추가!
    };

    const handleEndRejected = ({ fromUserId }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      setOutgoingRequest(null);
      upsertMessage(makeLocalSystemMessage('상대방이 매칭 종료를 거절했습니다.'));
    };

    if (sock) {
      sock.on('game:request', handleGameRequest);
      sock.on('game:confirmed', handleGameConfirmed);
      sock.on('game:rejected', handleGameRejected);
      sock.on('match:end:request', handleEndRequest);
      sock.on('match:ended', handleMatchEnded);
      sock.on('match:end:rejected', handleEndRejected);
    }

    const unsubscribe = subscribeChatIncoming(handleIncoming);

    // 상대가 채팅방을 나감 → 안내 메시지 + 채팅 종료 처리
    const unsubscribePartnerLeft = subscribePartnerLeft(({ fromUserId }) => {
      if (Number(fromUserId) !== Number(partnerIdRef.current)) return;
      upsertMessage(makeLocalSystemMessage('상대가 채팅방을 나갔어요.'));
      setPartnerLeft(true);
      setIsEndedChat(true);
      setGameStarted(false);
      setPartnerTyping(false);
      setOutgoingRequest(null);
      setIncomingRequest(null);
    });

    return () => {
      cancelled = true;
      roomReadyRef.current = false;
      clearTimeout(syncTimer);
      clearTimeout(partnerTypingClearTimerRef.current);
      clearTimeout(typingStopTimerRef.current);
      unsubscribe();
      unsubscribePartnerLeft();
      if (sock) {
        sock.off('chat:read:update', handleReadUpdate);
        sock.off('chat:typing', handlePartnerTyping);
        sock.off('game:request', handleGameRequest);
        sock.off('game:confirmed', handleGameConfirmed);
        sock.off('game:rejected', handleGameRejected);
        sock.off('match:end:request', handleEndRequest);
        sock.off('match:ended', handleMatchEnded);
        sock.off('match:end:rejected', handleEndRejected);
      }
    };
  }, [myId, matchedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const removeThisChatEverywhere = () => {
    const chatUserId = getChatUserId();

    const activeChats =
      JSON.parse(sessionStorage.getItem('activeChats')) || [];

    const chatHistory =
      JSON.parse(sessionStorage.getItem('chatHistory')) || [];

    sessionStorage.setItem(
      'activeChats',
      JSON.stringify(activeChats.filter((c) => Number(c.userId) !== Number(chatUserId)))
    );

    sessionStorage.setItem(
      'chatHistory',
      JSON.stringify(chatHistory.filter((c) => Number(c.userId) !== Number(chatUserId)))
    );

    sessionStorage.removeItem('currentMatch');
    sessionStorage.removeItem('selectedChat');
  };

  // 채팅방 나가기 — 매칭 해제 + 상대 알림 + 목록에서 제거
  const handleLeaveChat = () => {
    const partnerId = getChatUserId();
    setLeaveConfirmOpen(false);

    // 떠나는 나도 removedIds에서 상대 제거 → 메인에서 다시 보이도록
    if (myId && partnerId) {
      try {
        const key = `removedIds:${myId}`;
        const list = JSON.parse(sessionStorage.getItem(key)) || [];
        const next = list.filter((id) => Number(id) !== Number(partnerId));
        sessionStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* sessionStorage 접근 실패는 무시 */
      }

      emitChatExit(partnerId);
    }

    removeThisChatEverywhere();
    navigate('/my-chats', { replace: true });
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

  const sendMessage = async (rawText) => {
    const text = (rawText || '').trim();
    if (!text) return;
    if (isEndedChat || isExploding) return;
    if (!matchedUser) return;

    const partnerId = getChatUserId();
    if (!partnerId) return;

    stopMyTyping();

    pendingCounterRef.current += 1;
    const pendingId = `pending-${Date.now()}-${pendingCounterRef.current}`;

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
      const socket = await joinChatRoom(partnerId);
      roomReadyRef.current = true;

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

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    sendMessage(text);
  };

  const handleSuggestedMessage = (text) => {
    sendMessage(text);
  };

  // 게임 시작: 양쪽 동의 필요
  const handleStartGame = () => {
    if (isEndedChat || isExploding || gameStarted) return;
    const partnerId = getChatUserId();
    if (!partnerId) return;

    emitGameRequest(partnerId);
    setOutgoingRequest({ type: 'game' });
    upsertMessage(makeLocalSystemMessage('상대방에게 게임 시작을 요청했습니다.'));
  };

  // 매칭 종료: 양쪽 동의 필요
  const handleEndMatch = () => {
    if (!matchedUser || isExploding) return;
    if (!gameStarted) {
      alert('게임 시작 후 매칭을 종료할 수 있습니다.');
      return;
    }

    const partnerId = getChatUserId();
    if (!partnerId) return;

    emitMatchEndRequest(partnerId);
    setOutgoingRequest({ type: 'end' });
    upsertMessage(makeLocalSystemMessage('상대방에게 매칭 종료를 요청했습니다.'));
  };

  // 요청 수락/거절
  const acceptIncomingRequest = () => {
    const partnerId = getChatUserId();
    if (!partnerId || !incomingRequest) return;
    if (incomingRequest.type === 'game') {
      emitGameConfirm(partnerId);
    } else {
      emitMatchEndConfirm(partnerId);
    }
    setIncomingRequest(null);
  };

  const rejectIncomingRequest = () => {
    const partnerId = getChatUserId();
    if (!partnerId || !incomingRequest) return;
    if (incomingRequest.type === 'game') {
      emitGameReject(partnerId);
    } else {
      emitMatchEndReject(partnerId);
    }
    setIncomingRequest(null);
  };

  const cancelOutgoingRequest = () => {
    setOutgoingRequest(null);
  };

  // 별점 제출
  const handleRatingSubmit = async () => {
    const partnerId = getChatUserId();
    if (!partnerId) return;
    try {
      setRatingSubmitting(true);
      setRatingError(null);
      await createRating({
        from_user_id: myId,
        to_user_id: partnerId,
        match_id: ratingMatchId,
        score: ratingScore,
        badge: ratingBadge,
      });
      setRatingOpen(false);
      removeThisChatEverywhere();
      navigate('/my-chats', { replace: true });
    } catch (err) {
      setRatingError(err.message || '별점 등록에 실패했습니다.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleRatingSkip = () => {
    setRatingOpen(false);
    removeThisChatEverywhere();
    navigate('/my-chats', { replace: true });
  };

  // 신고 제출
  const handleReportSubmit = async () => {
    const partnerId = getChatUserId();
    if (!partnerId) return;
    if (!reportReason.trim()) {
      alert('신고 사유를 선택하거나 입력해 주세요.');
      return;
    }
    try {
      setReportSubmitting(true);
      await submitReport({
        reporter_id: myId,
        target_user_id: partnerId,
        reason: reportReason.trim(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportReason('');
      }, 1500);
    } catch (err) {
      alert(err.message || '신고 접수에 실패했습니다.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // 상대 프로필 사진 클릭 → 액션 메뉴 열기
  const openActionMenu = () => {
    if (!matchedUser) return;
    setActionMenuOpen(true);
  };

  // 프로필 모달 열고 데이터 로드 (공통)
  const openProfile = async (targetId, isSelf) => {
    if (!targetId) return;

    setProfileIsSelf(isSelf);
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError(null);
    setPartnerProfile(null);

    try {
      const data = await fetchUserById(targetId);
      setPartnerProfile(data);
    } catch (err) {
      setProfileError(err.message || '프로필을 불러오지 못했습니다.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 액션 메뉴 → 상대 정보보기
  const handleViewProfile = () => {
    setActionMenuOpen(false);
    openProfile(getChatUserId(), false);
  };

  // 내 메시지 아바타 → 내 프로필 보기 (신고 없음)
  const openMyProfile = () => {
    openProfile(myId, true);
  };

  // 액션 메뉴 → 신고하기
  const handleReportFromMenu = () => {
    setActionMenuOpen(false);
    setReportOpen(true);
  };

  const handleRestartMatch = () => {
    if (!matchedUser || isExploding) return;
    setIsEndedChat(false);
    setGameStarted(false);
    saveActiveChatMeta(false);
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">

      <style>{`
        @keyframes chat-explode {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          100% { transform: scale(0.2) translateY(-120px); opacity: 0; filter: blur(18px); }
        }
        .chat-exploding { animation: chat-explode 1.2s ease-in forwards; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      <div
        className={
          isExploding
            ? 'chat-exploding flex flex-col flex-1 relative z-10 pb-20'
            : 'flex flex-col flex-1 relative z-10 pb-20'
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
              className="p-2 rounded-full hover:bg-white/10 transition-all disabled:opacity-30"
            >
              <ArrowLeft size={24} />
            </button>

            {matchedUser && (
              <>
                <button
                  onClick={openActionMenu}
                  className="rounded-full transition-all hover:scale-105"
                  title="상대 프로필"
                >
                  <img
                    src={matchedUser.img || DEFAULT_AVATAR}
                    alt={matchedUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-violet-500/40 hover:border-violet-400"
                  />
                </button>

                <div>
                  <h2 className="text-lg font-black">{matchedUser.name}</h2>
                  <p className="text-sm text-stone-400">
                    {isEndedChat
                      ? '종료된 채팅방'
                      : gameStarted
                        ? '게임 진행 중'
                        : '듀오 채팅방'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 신고 / 나가기 버튼 */}
          {matchedUser && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportOpen(true)}
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-red-500/10 hover:bg-red-500/20
                  text-red-300 hover:text-red-200
                  text-xs font-black
                  border border-red-500/30
                  transition-all
                "
                title="채팅 상대 신고"
              >
                <Shield size={14} />
                신고
              </button>

              <button
                onClick={() => setLeaveConfirmOpen(true)}
                className="
                  flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-white/5 hover:bg-white/10
                  text-stone-300 hover:text-white
                  text-xs font-black
                  border border-white/10
                  transition-all
                "
                title="채팅방 나가기"
              >
                <LogOut size={14} />
                나가기
              </button>
            </div>
          )}
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
            <div className="text-center text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-2xl py-3 px-4">
              {historyError}
            </div>
          )}

          {!historyLoading && !historyError && messages.length === 0 && (
            <div className="text-center">
              <p className="text-stone-500 text-sm">
                아직 주고받은 메시지가 없습니다. 추천 메시지로 먼저 인사를 보내보세요!
              </p>

              {!isEndedChat && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_MESSAGES.map((text) => (
                    <button
                      key={text}
                      onClick={() => handleSuggestedMessage(text)}
                      disabled={isExploding}
                      className="
                        px-4 py-2 rounded-full text-sm font-medium
                        bg-violet-600/15 text-violet-200
                        border border-violet-500/30
                        hover:bg-violet-600/25 hover:text-white
                        transition-all disabled:opacity-40
                      "
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(() => {
            let lastReadByPartnerId = null;
            for (let i = messages.length - 1; i >= 0; i -= 1) {
              const m = messages[i];
              if (m.sender === 'me' && m.readAt) {
                lastReadByPartnerId = m.id;
                break;
              }
            }

            return messages.map((msg) => {
              const isMe = msg.sender === 'me';
              const isSystem = msg.sender === 'system';

              return (
              <div key={msg.id}>
                <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}>
                  {!isMe && !isSystem && (
                    <button
                      onClick={openActionMenu}
                      className="shrink-0 self-end transition-all hover:scale-110"
                      title="상대 프로필"
                    >
                      <img
                        src={matchedUser?.img || DEFAULT_AVATAR}
                        alt={matchedUser?.name || '상대'}
                        className="w-9 h-9 rounded-full object-cover border border-white/10 hover:border-violet-400"
                      />
                    </button>
                  )}

                  <div className={`
                      max-w-[70%] px-5 py-3 rounded-2xl text-sm font-medium break-all break-words whitespace-pre-wrap
                      ${isMe
                      ? msg.failed
                        ? 'bg-red-600/40 text-white border border-red-500/40'
                        : `bg-violet-600 text-white ${msg.pending ? 'opacity-70' : ''}`
                      : isSystem
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                        : 'bg-white/10 text-stone-200 border border-white/10'}
                  `}>
                    {msg.text}
                    {msg.failed && (
                      <span className="ml-2 text-[10px] font-bold text-red-200">전송 실패</span>
                    )}
                  </div>

                  {isMe && (
                    <button
                      onClick={openMyProfile}
                      className="shrink-0 self-end transition-all hover:scale-110"
                      title="내 프로필"
                    >
                      <img
                        src={myAvatar}
                        alt="나"
                        className="w-9 h-9 rounded-full object-cover border border-white/10 hover:border-violet-400"
                      />
                    </button>
                  )}
                </div>

                {msg.id === lastReadByPartnerId && (
                  <div className="flex justify-end mt-1 mr-1">
                    <span className="text-[10px] text-stone-500 font-medium">읽음</span>
                  </div>
                )}
              </div>
              );
            });
          })()}

          {partnerTyping && !isEndedChat && (
            <div className="flex items-end gap-2 justify-start">
              <img
                src={matchedUser?.img || DEFAULT_AVATAR}
                alt={matchedUser?.name || '상대'}
                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
              />
              <div className="bg-white/10 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-1">
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
              display: inline-block; width: 6px; height: 6px;
              border-radius: 9999px; background-color: rgb(216 180 254);
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

            {partnerLeft ? (
              <div className="
                w-full py-4 rounded-2xl
                bg-stone-800/60 border border-white/10
                text-stone-400 font-bold
                flex items-center justify-center gap-2
              ">
                <Flag size={18} />
                상대가 채팅방을 나가 더 이상 대화할 수 없어요.
              </div>
            ) : isEndedChat ? (
              <button
                onClick={handleRestartMatch}
                disabled={isExploding}
                className="
                  w-full py-4 rounded-2xl
                  bg-violet-600 hover:bg-violet-500
                  font-black flex items-center justify-center gap-2
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
                  disabled={gameStarted || isExploding || outgoingRequest?.type === 'game'}
                  className={`
                    flex-1 py-3 rounded-2xl font-bold
                    flex items-center justify-center gap-2 transition-all
                    ${gameStarted
                      ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                      : outgoingRequest?.type === 'game'
                        ? 'bg-amber-700/40 text-amber-300 cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
                  `}
                >
                  <Gamepad2 size={18} />
                  {gameStarted
                    ? '게임 진행 중'
                    : outgoingRequest?.type === 'game'
                      ? '상대 응답 대기...'
                      : '게임 시작 요청'}
                </button>

                <button
                  onClick={handleEndMatch}
                  disabled={isExploding || !gameStarted || outgoingRequest?.type === 'end'}
                  className={`
                    flex-1 py-3 rounded-2xl font-bold
                    flex items-center justify-center gap-2 transition-all
                    ${!gameStarted
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : outgoingRequest?.type === 'end'
                        ? 'bg-amber-700/40 text-amber-300 cursor-wait'
                        : 'bg-red-600 hover:bg-red-500 text-white'}
                  `}
                >
                  <Flag size={18} />
                  {outgoingRequest?.type === 'end' ? '상대 응답 대기...' : '매칭 종료 요청'}
                </button>
              </div>
            )}

            {outgoingRequest && (
              <button
                onClick={cancelOutgoingRequest}
                className="w-full text-xs text-stone-400 hover:text-white py-1"
              >
                요청 취소
              </button>
            )}

            {!gameStarted && !isEndedChat && !outgoingRequest && (
              <p className="text-xs text-stone-500 text-center">
                게임 시작·매칭 종료는 두 사람 모두의 동의가 필요합니다.
              </p>
            )}

            <div className="flex gap-3">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                disabled={isEndedChat || isExploding || partnerLeft}
                placeholder={
                  partnerLeft
                    ? '상대가 채팅방을 나갔습니다.'
                    : isEndedChat
                      ? '종료된 채팅방에서는 메시지를 보낼 수 없습니다.'
                      : '메시지를 입력하세요...'
                }
                className={`
                  flex-1 h-14 rounded-2xl
                  bg-white/5 border border-white/10
                  px-5 outline-none focus:border-violet-500
                  ${isEndedChat || isExploding || partnerLeft ? 'text-stone-500 cursor-not-allowed' : 'text-white'}
                `}
              />

              <button
                onClick={handleSend}
                disabled={isEndedChat || isExploding || partnerLeft}
                className={`
                  w-14 h-14 rounded-2xl
                  flex items-center justify-center
                  ${isEndedChat || isExploding || partnerLeft
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

      {/* 하단 네비 — #6 */}
      <nav className="
        fixed bottom-0 left-0 right-0
        bg-black/60 backdrop-blur-2xl
        border-t border-purple-500/10
        z-30
      ">
        <div className="max-w-6xl mx-auto flex justify-center items-center gap-24 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-white transition-all"
          >
            <HomeIcon size={24} />
            <span className="text-xs font-medium">홈</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-violet-400 scale-110">
            <MessageCircle size={24} />
            <span className="text-xs font-bold">채팅</span>
          </button>

          <button
            onClick={() => navigate('/mypage')}
            className="flex flex-col items-center gap-1 text-stone-400 hover:text-white transition-all"
          >
            <UserIcon size={24} />
            <span className="text-xs font-medium">마이페이지</span>
          </button>
        </div>
      </nav>

      {/* 들어온 요청 (게임시작/매칭종료) 수락 모달 */}
      {incomingRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-[#12091f] border border-violet-500/30 rounded-3xl p-7 text-center shadow-[0_0_60px_rgba(124,58,237,0.45)]">
            <h3 className="text-2xl font-black mb-3">
              {incomingRequest.type === 'game' ? '게임 시작 요청' : '매칭 종료 요청'}
            </h3>
            <p className="text-stone-300 mb-7">
              <span className="text-violet-300 font-bold">{matchedUser?.name}</span>
              님이{' '}
              {incomingRequest.type === 'game'
                ? '게임 시작을 제안했어요.'
                : '매칭 종료를 제안했어요.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={rejectIncomingRequest}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-stone-300 font-bold hover:bg-white/10"
              >
                거절
              </button>
              <button
                onClick={acceptIncomingRequest}
                className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} /> 수락
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 채팅방 나가기 확인 모달 */}
      {leaveConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setLeaveConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#12091f] border border-violet-500/30 rounded-3xl p-7 text-center shadow-[0_0_60px_rgba(124,58,237,0.45)]"
          >
            <h3 className="text-2xl font-black mb-3">채팅방 나가기</h3>
            <p className="text-stone-300 mb-7">
              정말 나가시겠습니까?
              <br />
              <span className="text-stone-500 text-sm">
                채팅방이 목록에서 사라집니다.
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveConfirmOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-stone-300 font-bold hover:bg-white/10"
              >
                아니오
              </button>
              <button
                onClick={handleLeaveChat}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> 네
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상대 프로필 액션 메뉴 (정보보기 / 신고하기) */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setActionMenuOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#12091f] border border-violet-500/30 rounded-3xl p-5 shadow-[0_0_60px_rgba(124,58,237,0.45)]"
          >
            <div className="flex items-center gap-3 mb-5">
              <img
                src={matchedUser?.img || DEFAULT_AVATAR}
                alt={matchedUser?.name}
                className="w-12 h-12 rounded-full object-cover border border-violet-500/40"
              />
              <div>
                <p className="font-black text-white">{matchedUser?.name}</p>
                <p className="text-xs text-stone-400">매칭된 상대</p>
              </div>
            </div>

            <button
              onClick={handleViewProfile}
              className="w-full mb-2 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2 transition-all"
            >
              <UserIcon size={18} /> 상대 정보보기
            </button>

            <button
              onClick={handleReportFromMenu}
              className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold border border-red-500/30 flex items-center justify-center gap-2 transition-all"
            >
              <Shield size={18} /> 신고하기
            </button>
          </div>
        </div>
      )}

      {/* 상대 상세 프로필 모달 */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => setProfileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#12091f] border border-violet-500/30 rounded-3xl p-7 shadow-[0_0_60px_rgba(124,58,237,0.45)]"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-white">
                {profileIsSelf ? '내 프로필' : '상대 프로필'}
              </h3>
              <button
                onClick={() => setProfileOpen(false)}
                className="p-2 rounded-full text-stone-500 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {profileLoading && (
              <div className="py-10 text-center text-stone-400 text-sm">
                프로필 불러오는 중...
              </div>
            )}

            {!profileLoading && profileError && (
              <div className="py-6 text-center text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-2xl">
                {profileError}
              </div>
            )}

            {!profileLoading && !profileError && partnerProfile && (
              <>
                <div className="flex flex-col items-center text-center mb-6">
                  <img
                    src={partnerProfile.profile_image || DEFAULT_AVATAR}
                    alt={partnerProfile.nickname}
                    className="w-24 h-24 rounded-full object-cover border border-violet-500/40 shadow-[0_0_30px_rgba(124,58,237,0.25)]"
                  />
                  <h4 className="mt-4 text-2xl font-black text-white">
                    {partnerProfile.nickname}
                  </h4>
                  {(partnerProfile.riot_name || partnerProfile.riot_tag) && (
                    <p className="mt-1 text-sm font-bold text-stone-300">
                      {partnerProfile.riot_name || partnerProfile.nickname}
                      <span className="text-stone-500 font-medium ml-1">
                        #{partnerProfile.riot_tag || 'KR1'}
                      </span>
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    {partnerProfile.tier && (
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black ${getTierBadgeClass(partnerProfile.tier)}`}>
                        {getTierShortLabel(partnerProfile.tier)}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                      <Star size={14} className="fill-yellow-400" />
                      {Number(partnerProfile.rating || 0).toFixed(1)}
                      <span className="text-stone-500 font-medium">
                        ({partnerProfile.rating_count || 0})
                      </span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl px-5 py-3">
                    <span className="text-stone-500 font-medium text-sm">주 게임 모드</span>
                    <span className="font-bold text-violet-300 text-sm">{partnerProfile.game_mode || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl px-5 py-3">
                    <span className="text-stone-500 font-medium text-sm">주 포지션</span>
                    <span className="font-bold text-white text-sm">{partnerProfile.line || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-2xl px-5 py-3">
                    <span className="text-stone-500 font-medium text-sm">플레이 스타일</span>
                    <span className="font-bold text-orange-400 text-sm">{partnerProfile.duo_style || '-'}</span>
                  </div>
                  <div className="bg-black/30 border border-white/5 rounded-2xl px-5 py-3">
                    <p className="text-stone-500 font-medium text-sm mb-1">한줄 소개</p>
                    <p className="text-stone-200 text-sm leading-relaxed">
                      {partnerProfile.intro || '자기소개가 없습니다.'}
                    </p>
                  </div>
                </div>

                {!profileIsSelf && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setReportOpen(true);
                    }}
                    className="w-full mt-6 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold border border-red-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Shield size={18} /> 신고하기
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 별점 모달 — #5 */}
      {ratingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-[#12091f] border border-violet-500/30 rounded-3xl p-7 text-center shadow-[0_0_60px_rgba(124,58,237,0.45)]">
            <h3 className="text-2xl font-black mb-2">매칭이 종료되었어요!</h3>
            <p className="text-stone-400 text-sm mb-6">
              {matchedUser?.name}님과의 게임은 어땠나요?
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatingScore(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={n <= ratingScore ? 'text-yellow-400' : 'text-stone-700'}
                    fill={n <= ratingScore ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            {/* 별점 선택 아래에 들어갈 칭찬 뱃지 UI */}
            <div className="flex flex-col gap-2 mb-6">
            <p className="text-xs text-stone-400 mb-1">칭찬 뱃지를 함께 남겨주세요 (선택)</p>
              {['실력이 뛰어나요', '소통이 잘 돼요', '멘탈이 좋아요'].map(badge => (
                <button
      key={badge}
      onClick={() => setRatingBadge(ratingBadge === badge ? '' : badge)}
      className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all ${
        ratingBadge === badge
          ? 'bg-violet-600 border-violet-500 text-white'
          : 'bg-white/5 border-white/10 text-stone-400 hover:bg-white/10'
      }`}
    >
      {badge}
    </button>
  ))}
</div>

            {ratingError && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-4">
                {ratingError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRatingSkip}
                disabled={ratingSubmitting}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-stone-300 font-bold hover:bg-white/10 disabled:opacity-50"
              >
                나중에
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={ratingSubmitting}
                className="flex-1 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold disabled:opacity-50"
              >
                {ratingSubmitting ? '등록 중...' : `${ratingScore}점 주기`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 모달 — #9 */}
      {reportOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          onClick={() => !reportSubmitting && setReportOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#12091f] border border-red-500/30 rounded-3xl p-7 shadow-[0_0_60px_rgba(239,68,68,0.35)]"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-black text-red-300 flex items-center gap-2">
                <Shield size={20} /> 채팅 상대 신고
              </h3>
              <button
                onClick={() => !reportSubmitting && setReportOpen(false)}
                className="p-2 rounded-full text-stone-500 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-10 text-center">
                <Check size={40} className="mx-auto text-emerald-400 mb-3" />
                <p className="text-emerald-300 font-bold">신고가 접수되었습니다.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-400 mb-3">신고 사유 선택</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {['욕설/혐오', '도배/스팸', '음란/부적절', '사기/허위'].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className={`
                        py-3 rounded-xl text-sm font-bold transition-all
                        ${reportReason === reason
                          ? 'bg-red-500/20 border border-red-400/40 text-red-200'
                          : 'bg-white/5 border border-white/10 text-stone-400 hover:text-white'}
                      `}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="추가 사유를 자세히 입력해 주세요 (선택)"
                  rows={3}
                  className="
                    w-full rounded-xl bg-black/40 border border-white/10
                    px-4 py-3 text-sm text-white placeholder:text-stone-600
                    outline-none focus:border-red-500
                  "
                />

                <button
                  onClick={handleReportSubmit}
                  disabled={reportSubmitting || !reportReason.trim()}
                  className="
                    w-full mt-5 py-3 rounded-2xl
                    bg-red-600 hover:bg-red-500 disabled:bg-stone-700
                    text-white font-black
                    disabled:cursor-not-allowed
                  "
                >
                  {reportSubmitting ? '접수 중...' : '신고 접수'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
