import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { fetchChatList } from '../api/users';
import { getCurrentUserId } from '../auth';
import { subscribeChatIncoming, getSocket } from '../socket';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

function timeAgo(iso) {
  if (!iso) return '';
  // SQLite datetime('now')는 UTC 문자열 — 'Z' 붙여서 UTC로 인식
  const ts = Date.parse(iso.endsWith('Z') ? iso : iso + 'Z');
  if (Number.isNaN(ts)) return '';
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return '방금 전';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR');
}

export default function MyChats() {
  const navigate = useNavigate();
  const myId = getCurrentUserId();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!myId) return;
    try {
      setError(null);
      const data = await fetchChatList(myId);
      setRooms(data);
    } catch (err) {
      setError(err.message || '채팅 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    if (!myId) {
      navigate('/login', { replace: true });
      return;
    }
    load();
  }, [myId, navigate, load]);

  // 새 메시지 or 읽음 업데이트 들어오면 목록 갱신
  useEffect(() => {
    if (!myId) return;
    const unsubscribe = subscribeChatIncoming(() => load());

    const sock = getSocket();
    const onReadUpdate = () => load();
    if (sock) sock.on('chat:read:update', onReadUpdate);

    return () => {
      unsubscribe();
      if (sock) sock.off('chat:read:update', onReadUpdate);
    };
  }, [myId, load]);

  const handleOpenChat = (room) => {
    sessionStorage.removeItem('selectedChat');
    sessionStorage.setItem(
      'currentMatch',
      JSON.stringify({
        id: room.partner.id,
        userId: room.partner.id,
        name: room.partner.nickname,
        tag: 'KR1',
        img: room.partner.profile_image || DEFAULT_AVATAR,
      })
    );
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      <header className="
        relative z-10 h-20 border-b border-white/10
        flex items-center gap-4 px-8
        backdrop-blur-xl bg-black/20
      ">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={24} />
        </button>

        <div>
          <h1 className="text-2xl font-black tracking-tight">
            나의 채팅방
          </h1>
          <p className="text-sm text-stone-400">
            매칭된 듀오와의 실시간 대화
          </p>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8 space-y-4">

        {loading && (
          <div className="text-center text-stone-500 py-10">
            채팅 목록 불러오는 중...
          </div>
        )}

        {!loading && error && (
          <div className="
            text-center text-red-300 text-sm
            bg-red-500/10 border border-red-500/30
            rounded-2xl py-4
          ">
            {error}
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="
            bg-white/5 border border-white/10
            rounded-[32px] p-10 text-center
          ">
            <MessageCircle size={40} className="mx-auto text-violet-400 mb-4" />
            <h2 className="text-2xl font-black mb-2">
              아직 매칭된 듀오가 없습니다
            </h2>
            <p className="text-stone-400">
              홈에서 마음에 드는 상대에게 ✓를 눌러 매칭해 보세요.
            </p>
          </div>
        )}

        {!loading && !error && rooms.map((room) => {
          const isLastFromMe =
            room.lastMessage &&
            Number(room.lastMessage.sender_id) === Number(myId);

          return (
            <button
              key={room.partner.id}
              onClick={() => handleOpenChat(room)}
              className="
                w-full text-left
                bg-white/5 backdrop-blur-xl
                border border-white/10
                rounded-[28px] p-5
                hover:bg-white/[0.07]
                hover:border-violet-500/30
                transition-all duration-300
                flex items-center gap-5
              "
            >
              <div className="relative shrink-0">
                <img
                  src={room.partner.profile_image || DEFAULT_AVATAR}
                  alt={room.partner.nickname}
                  className="
                    w-16 h-16 rounded-2xl object-cover
                    border border-violet-500/30
                  "
                />
                {room.unreadCount > 0 && (
                  <span className="
                    absolute -top-1 -right-1
                    min-w-[20px] h-5 px-1.5
                    rounded-full
                    bg-violet-500 text-white
                    text-[11px] font-black
                    flex items-center justify-center
                    shadow-[0_0_12px_rgba(124,58,237,0.6)]
                  ">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black tracking-tight truncate">
                    {room.partner.nickname}
                    {room.partner.tier && (
                      <span className="ml-2 text-xs text-stone-500 font-medium">
                        {room.partner.tier}
                      </span>
                    )}
                  </h2>

                  {room.lastMessage?.created_at && (
                    <span className="text-[11px] text-stone-500 shrink-0">
                      {timeAgo(room.lastMessage.created_at)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {room.lastMessage ? (
                    <p
                      className={`
                        text-sm truncate
                        ${room.unreadCount > 0 && !isLastFromMe
                          ? 'text-white font-semibold'
                          : 'text-stone-400'}
                      `}
                    >
                      {isLastFromMe && (
                        <span className="text-stone-500 mr-1">나:</span>
                      )}
                      {room.lastMessage.message}
                    </p>
                  ) : (
                    <p className="text-sm text-stone-500 flex items-center gap-1.5">
                      <Clock size={13} />
                      매칭됨 — 먼저 인사를 건네 보세요!
                    </p>
                  )}
                </div>
              </div>

              <ChevronRight size={20} className="text-stone-500 shrink-0" />
            </button>
          );
        })}
      </main>
    </div>
  );
}
