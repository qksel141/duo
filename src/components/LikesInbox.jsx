import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { fetchReceivedLikes } from '../api/users';
import { getCurrentUserId } from '../auth';
import { getSocket } from '../socket';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

const SEEN_KEY = 'likesInboxSeenId';

function getSeenMaxId() {
  const raw = sessionStorage.getItem(SEEN_KEY);
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function setSeenMaxId(id) {
  sessionStorage.setItem(SEEN_KEY, String(id));
}

function timeAgo(iso) {
  if (!iso) return '';
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

export default function LikesInbox() {
  const navigate = useNavigate();
  const myId = getCurrentUserId();

  const [open, setOpen] = useState(false);
  const [likes, setLikes] = useState([]);
  const [seenMaxId, setSeenMaxIdState] = useState(getSeenMaxId());
  const [loading, setLoading] = useState(false);
  const [likingBackId, setLikingBackId] = useState(null);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    if (!myId) return;
    try {
      setLoading(true);
      const data = await fetchReceivedLikes(myId);
      setLikes(data);
    } catch (err) {
      console.warn('받은 좋아요 조회 실패', err);
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    load();
  }, [myId, load]);

  useEffect(() => {
    if (!myId) return;
    const sock = getSocket();
    if (!sock) return;

    const onLike = () => load();
    const onMatch = () => load();
    sock.on('like:received', onLike);
    sock.on('match:made', onMatch);

    return () => {
      sock.off('like:received', onLike);
      sock.off('match:made', onMatch);
    };
  }, [myId, load]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // 매칭이 성립된 from_user_id 모음 — "답하기" 버튼 비활성용
  const matchedIds = new Set();

  const visibleLikes = likes.filter((l) => !matchedIds.has(l.from_user_id));

  const unreadCount = visibleLikes.filter((l) => l.id > seenMaxId).length;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && visibleLikes.length > 0) {
      const max = Math.max(...visibleLikes.map((l) => l.id));
      setSeenMaxId(max);
      setSeenMaxIdState(max);
    }
  };

  const handleLikeBack = (like) => {
    const sock = getSocket();
    if (!sock) return;

    setLikingBackId(like.from_user_id);
    sock.emit(
      'like:send',
      { toUserId: like.from_user_id },
      (ack) => {
        setLikingBackId(null);
        if (!ack?.ok) {
          console.warn('like back 실패', ack?.error);
          return;
        }
        // 성공 시 목록에서 제거 (매칭됐든 아니든)
        setLikes((prev) => prev.filter((l) => l.id !== like.id));

        if (ack.matched && ack.partner) {
          const matchData = {
            id: ack.partner.id,
            userId: ack.partner.id,
            name: ack.partner.nickname,
            tag: 'KR1',
            img: ack.partner.profile_image,
          };
          sessionStorage.setItem('currentMatch', JSON.stringify(matchData));
          setOpen(false);
          navigate('/chat');
        }
      }
    );
  };

  if (!myId) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="
          relative p-2 rounded-xl
          text-stone-300 hover:text-white
          hover:bg-white/10
          transition-colors
        "
        title="받은 좋아요"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            min-w-[18px] h-[18px] px-1
            rounded-full
            bg-violet-500 text-white
            text-[10px] font-black
            flex items-center justify-center
            shadow-[0_0_10px_rgba(124,58,237,0.7)]
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="
          absolute right-0 mt-3
          w-[360px] max-h-[480px]
          bg-[#0c0816]/95 backdrop-blur-2xl
          border border-violet-500/20
          rounded-3xl
          shadow-[0_20px_60px_rgba(0,0,0,0.7)]
          overflow-hidden
          flex flex-col
          z-50
        ">
          <div className="
            px-5 py-4
            border-b border-white/10
            flex items-center gap-2
          ">
            <Sparkles size={18} className="text-violet-400" />
            <h3 className="text-base font-black tracking-tight">
              받은 좋아요
            </h3>
            <span className="ml-auto text-xs text-stone-500">
              {visibleLikes.length}건
            </span>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="p-8 text-center text-sm text-stone-500">
                불러오는 중...
              </div>
            )}

            {!loading && visibleLikes.length === 0 && (
              <div className="p-10 text-center">
                <Heart size={28} className="mx-auto text-stone-600 mb-3" />
                <p className="text-sm text-stone-400 font-medium">
                  아직 받은 좋아요가 없습니다
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  누군가 ✓를 눌러주면 여기 모여요
                </p>
              </div>
            )}

            {!loading && visibleLikes.map((like) => {
              const isUnread = like.id > seenMaxId;
              return (
                <div
                  key={like.id}
                  className={`
                    px-4 py-3
                    flex items-center gap-3
                    border-b border-white/5
                    transition-colors
                    ${isUnread ? 'bg-violet-500/[0.06]' : 'hover:bg-white/[0.03]'}
                  `}
                >
                  <div className="relative shrink-0">
                    <img
                      src={like.profile_image || DEFAULT_AVATAR}
                      alt={like.nickname}
                      className="
                        w-12 h-12 rounded-2xl object-cover
                        border border-violet-500/30
                      "
                    />
                    {isUnread && (
                      <span className="
                        absolute -top-0.5 -right-0.5
                        w-2.5 h-2.5 rounded-full
                        bg-violet-500
                        shadow-[0_0_8px_rgba(124,58,237,0.8)]
                      " />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">
                      {like.nickname}
                      {like.tier && (
                        <span className="ml-1.5 text-[10px] text-stone-500 font-medium">
                          {like.tier}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {timeAgo(like.created_at)} · 나에게 좋아요
                    </p>
                  </div>

                  <button
                    onClick={() => handleLikeBack(like)}
                    disabled={likingBackId === like.from_user_id}
                    className="
                      shrink-0
                      px-3 py-1.5 rounded-xl
                      bg-violet-600 hover:bg-violet-500
                      text-white text-xs font-black
                      transition-colors
                      disabled:opacity-50 disabled:cursor-wait
                      flex items-center gap-1
                    "
                  >
                    <Heart size={12} fill="currentColor" />
                    답하기
                  </button>
                </div>
              );
            })}
          </div>

          {visibleLikes.length > 0 && (
            <div className="
              px-4 py-2.5
              border-t border-white/10
              text-[11px] text-stone-500 text-center
            ">
              "답하기"를 누르면 즉시 매칭됩니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
