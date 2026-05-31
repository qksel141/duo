import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MessageCircle,
  Home as HomeIcon,
  User,
  LogOut
} from 'lucide-react';

import { fetchUsers, toProfile } from '../api/users';
import { getCurrentUser, getCurrentUserId, clearCurrentUser } from '../auth';
import { disconnectSocket, getSocket } from '../socket';
import LikesInbox from '../components/LikesInbox';

function renderStars(rating) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return '★★★★★'.slice(0, safe) + '☆☆☆☆☆'.slice(0, 5 - safe);
}

export default function Home() {
  const navigate = useNavigate();

  const currentUser = getCurrentUser();
  const myId = getCurrentUserId();

  const [profiles, setProfiles] = useState([]);

  const [onlineUserIds, setOnlineUserIds] = useState([]);

  const [removedIds, setRemovedIds] = useState(() => {
    return JSON.parse(sessionStorage.getItem('removedIds')) || [];
  });
  const [matchedProfile, setMatchedProfile] = useState(null);

  const handleLogout = () => {
    disconnectSocket();
    clearCurrentUser();
    navigate('/login', { replace: true });
  };



  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [vAnimState, setVAnimState] = useState('');

  useEffect(() => {
    sessionStorage.setItem('removedIds', JSON.stringify(removedIds));
  }, [removedIds]);

  // 실시간 유저 생성/수정 반영
  useEffect(() => {
    if (!myId) return;

    const socket = getSocket();

    if (!socket) return;

    const handleUserCreated = (newUser) => {
      console.log('새 유저 도착', newUser);

      if (Number(newUser.id) === Number(myId)) return;

      setProfiles((prev) => {
        const alreadyExists = prev.some(
          (profile) => Number(profile.id) === Number(newUser.id)
        );

        if (alreadyExists) return prev;

        return [...prev, toProfile(newUser)];
      });
    };

    const handleUserUpdated = (updatedUser) => {
      console.log('유저 수정 도착', updatedUser);

      setProfiles((prev) =>
        prev.map((profile) =>
          Number(profile.id) === Number(updatedUser.id)
            ? toProfile(updatedUser)
            : profile
        )
      );
    };

    socket.on('user:created', handleUserCreated);
    socket.on('user:updated', handleUserUpdated);

    return () => {
      socket.off('user:created', handleUserCreated);
      socket.off('user:updated', handleUserUpdated);
    };
  }, [myId]);

  // 실시간 온라인/오프라인 반영
  useEffect(() => {
    if (!myId) return;

    const socket = getSocket();

    if (!socket) return;

    const handleOnlineUsers = ({ userIds }) => {
      setOnlineUserIds(userIds.map(Number));
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = [...prev.map(Number), Number(userId)];
        return [...new Set(next)];
      });
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) =>
        prev.filter((id) => Number(id) !== Number(userId))
      );
    };

    socket.on('online:users', handleOnlineUsers);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    return () => {
      socket.off('online:users', handleOnlineUsers);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [myId]);

  // Home에서 직접 match:made 수신 → 모달 띄움
  useEffect(() => {
    if (!myId) return;

    const socket = getSocket();

    if (!socket) return;

    const onMatch = ({ partner }) => {
      if (!partner) return;

      const matchData = {
        id: partner.id,
        userId: partner.id,
        name: partner.nickname,
        tag: 'KR1',
        img: partner.profile_image,
      };

      setMatchedProfile(matchData);

      sessionStorage.setItem(
        'currentMatch',
        JSON.stringify(matchData)
      );
    };

    socket.on('match:made', onMatch);

    return () => {
      socket.off('match:made', onMatch);
    };
  }, [myId]);

  // 최초 유저 목록 불러오기
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const users = await fetchUsers();

        if (cancelled) return;

        setProfiles(users.map(toProfile));
        setCurrentIndex(0);
      } catch (err) {
        if (cancelled) return;

        setError(err.message || '알 수 없는 오류');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProfiles = profiles.filter((profile) => {
    if (Number(profile.id) === Number(myId)) return false;
    return !removedIds.map(Number).includes(Number(profile.id));
  });

  const profileCount = visibleProfiles.length;

  const addRemovedId = (id) => {
    setRemovedIds((prev) => {
      const next = [...prev.map(Number), Number(id)];
      return [...new Set(next)];
    });
  };

  const nextSlide = () => {
    if (vAnimState !== '' || profileCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % profileCount);
  };

  const prevSlide = () => {
    if (vAnimState !== '' || profileCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + profileCount) % profileCount);
  };

  const handleVButtonClick = () => {
    if (vAnimState !== '' || profileCount === 0) return;

    const currentProfile = visibleProfiles[currentIndex];
    const socket = getSocket();

    setVAnimState('zoom');

    setTimeout(() => {
      setVAnimState('fly-right');

      setTimeout(() => {
        if (socket) {
          socket.emit(
            'like:send',
            { toUserId: currentProfile.id },
            (ack) => {
              if (!ack?.ok) {
                console.warn('like 전송 실패:', ack?.error);
                return;
              }

              if (ack.matched && ack.partner) {
                const matchData = {
                  id: ack.partner.id,
                  userId: ack.partner.id,
                  name: ack.partner.nickname,
                  tag: 'KR1',
                  img: ack.partner.profile_image,
                };

                setMatchedProfile(matchData);
                sessionStorage.setItem('currentMatch', JSON.stringify(matchData));

                const existingChats =
                  JSON.parse(sessionStorage.getItem('activeChats')) || [];

                const alreadyExists = existingChats.some(
                  (chat) =>
                    Number(chat.userId) === Number(ack.partner.id)
                );

                if (!alreadyExists) {
                  const newChat = {
                    id: Date.now(),
                    userId: ack.partner.id,
                    name: ack.partner.nickname,
                    tag: 'KR1',
                    img: ack.partner.profile_image,
                    createdAt: new Date().toLocaleString('ko-KR'),
                  };

                  sessionStorage.setItem(
                    'activeChats',
                    JSON.stringify([newChat, ...existingChats])
                  );
                }
              }
            }
          );
        }

        addRemovedId(currentProfile.id);

        if (currentIndex >= profileCount - 1) {
          setCurrentIndex(0);
        }

        setVAnimState('');
      }, 500);
    }, 200);
  };

  const handleXButtonClick = () => {
    if (vAnimState !== '' || profileCount === 0) return;

    const currentProfile = visibleProfiles[currentIndex];

    addRemovedId(currentProfile.id);

    if (currentIndex >= profileCount - 1) {
      setCurrentIndex(0);
    }
  };

  const getCardStyles = (index) => {
    let diff = index - currentIndex;
    const len = profileCount;

    if (diff < -Math.floor(len / 2)) diff += len;
    if (diff > Math.floor(len / 2)) diff -= len;

    if (diff === 0) {
      let baseStyles =
        'z-30 opacity-100 scale-100 translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]';

      if (vAnimState === 'zoom') {
        return baseStyles + ' !duration-200 !scale-[1.06] !shadow-[0_0_80px_rgba(124,58,237,0.6)]';
      }

      if (vAnimState === 'fly-right') {
        return baseStyles + ' !duration-500 !translate-x-[70vw] !-translate-y-[70vh] !scale-10 !opacity-0 !rotate-12 pointer-events-none';
      }

      return baseStyles + ' hover:scale-[1.01]';
    }

    if (diff === 1) {
      return 'z-20 opacity-35 scale-75 translate-x-[260px] pointer-events-none rotate-3 blur-[1px]';
    }

    if (diff === -1) {
      return 'z-20 opacity-35 scale-75 -translate-x-[260px] pointer-events-none -rotate-3 blur-[1px]';
    }

    if (diff > 1) {
      return 'z-10 opacity-0 scale-50 translate-x-[500px] pointer-events-none';
    }

    return 'z-10 opacity-0 scale-50 -translate-x-[500px] pointer-events-none';
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">

      {/* 파도 Flow 배경 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <style>{`
          @keyframes wave-stream-horizontal {
            0% { transform: translateX(110vw); opacity: 0; }
            5% { opacity: 0.6; }
            95% { opacity: 0.6; }
            100% { transform: translateX(-100vw); opacity: 0; }
          }

          @keyframes bg-wave-leftright {
            0% { transform: translateX(5%) translateY(-5%) scale(1); }
            50% { transform: translateX(-10%) translateY(5%) scale(1.1); }
            100% { transform: translateX(5%) translateY(-5%) scale(1); }
          }

          .animate-bg-wave {
            animation: bg-wave-leftright 14s infinite ease-in-out;
          }

          .wave-line {
            position: absolute;
            background: linear-gradient(to left, transparent, rgba(147, 51, 234, 0.6), #ffffff, rgba(219, 39, 119, 0.6), transparent);
            height: 3px;
            border-radius: 999px;
            filter: blur(0.5px);
            animation: wave-stream-horizontal infinite linear;
          }
        `}</style>

        <div className="wave-line w-[600px]" style={{ top: '30%', animationDuration: '3.5s', animationDelay: '0s' }} />
        <div className="wave-line w-[400px]" style={{ top: '42%', animationDuration: '4.8s', animationDelay: '-1.5s' }} />
        <div className="wave-line w-[750px]" style={{ top: '50%', animationDuration: '3.0s', animationDelay: '-0.5s' }} />
        <div className="wave-line w-[500px]" style={{ top: '58%', animationDuration: '4.2s', animationDelay: '-2.8s' }} />
        <div className="wave-line w-[650px]" style={{ top: '70%', animationDuration: '3.8s', animationDelay: '-1.0s' }} />

        <div className="absolute top-[20%] -right-[20%] w-[80vw] h-[50vh] rounded-[100px] bg-gradient-to-l from-purple-600/20 via-fuchsia-600/10 to-transparent blur-[120px] animate-bg-wave" />

        <div
          className="absolute top-[40%] -left-[20%] w-[70vw] h-[45vh] rounded-[100px] bg-gradient-to-r from-indigo-600/15 via-violet-600/5 to-transparent blur-[130px] animate-bg-wave"
          style={{ animationDelay: '-4s' }}
        />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vh] rounded-full bg-purple-500/5 blur-[160px]" />
      </div>

      {/* 네비게이션 바 */}
      <header className="w-full max-w-[90%] xl:max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex items-center justify-between z-50">
        <button
          onClick={() => window.location.reload()}
          className="text-3xl font-black tracking-tight text-white hover:text-purple-300 transition-colors"
        >
          FInd DUO
        </button>

        <div className="flex items-center gap-6">
          <LikesInbox />

          <button
            onClick={() => navigate('/my-chats')}
            className="text-xl font-black tracking-tight text-white hover:text-purple-300 transition-colors duration-300"
          >
            채팅방
          </button>

          <button
            onClick={() => navigate('/mypage')}
            className="px-6 py-2 text-xl font-black tracking-tight text-white hover:text-purple-300 transition-colors duration-300"
          >
            마이페이지
          </button>

          {currentUser && (
            <div className="
              flex items-center gap-3
              pl-4 ml-2
              border-l border-white/10
            ">
              <span className="text-sm text-stone-300">
                <span className="text-stone-500">접속:</span>{' '}
                <span className="font-bold text-violet-300">
                  {currentUser.nickname}
                </span>
                <span className="text-xs text-stone-500 ml-1">
                  #{currentUser.id}
                </span>
              </span>

              <button
                onClick={handleLogout}
                className="
                  p-2 rounded-xl
                  text-stone-400 hover:text-white
                  hover:bg-white/10
                  transition-colors
                "
                title="다른 유저로 로그인"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex items-center justify-center px-4 pb-28 select-none z-10">
        <div className="flex items-center gap-16 relative max-w-6xl w-full justify-center">

          <button
            onClick={prevSlide}
            className="w-20 h-20 rounded-full bg-stone-950/40 border border-purple-500/20 flex items-center justify-center text-4xl text-stone-400 hover:text-white hover:scale-110 transition-all z-40"
          >
            ←
          </button>

          <div className="flex flex-col gap-6 items-center">
            <div className="relative w-[400px] h-[680px] flex items-center justify-center">
              {loading && (
                <div className="text-stone-400 text-sm">
                  유저 정보를 불러오는 중...
                </div>
              )}

              {!loading && error && (
                <div className="text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {!loading && !error && profileCount === 0 && (
                <div className="text-stone-400 text-sm">
                  모든 유저를 봤습니다!
                </div>
              )}

              {!loading && !error && visibleProfiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className={`
                    absolute inset-0 rounded-3xl overflow-hidden bg-stone-900/90
                    border border-white/10 transition-all duration-500 ease-in-out
                    ${getCardStyles(index)}
                  `}
                >
                  <img
                    src={profile.img}
                    alt={profile.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent">
                    <h2 className="text-3xl font-extrabold text-white">
                      {profile.name}
                    </h2>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                        onlineUserIds.includes(Number(profile.id))
                        ? 'bg-emerald-400'
                        : 'bg-stone-500'
                        }`}
                      />
                      <span className="text-xs text-stone-300 font-medium">
                        {
                          onlineUserIds.includes(Number(profile.id))
                            ? '온라인'
                            : '오프라인'
                        }
                      </span>
                    </div>

                    <p className="text-stone-200 mt-1.5 text-sm">
                      {profile.rank}
                    </p>
                    <p className="text-stone-300 mt-2 text-sm">
                      {profile.msg}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-950/80 border border-stone-800">
                      <span className="text-yellow-500 text-sm">
                        {renderStars(profile.rating)}
                      </span>

                      <span className="text-stone-300 text-xs font-semibold">
                        {profile.rating.toFixed(1)} ({profile.ratingCount})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 w-[400px] h-16 z-40">
              <button
                onClick={handleXButtonClick}
                className="flex-1 bg-stone-950/40 text-white hover:text-red-500 border border-purple-500/10 transition-all duration-300 flex items-center justify-center text-2xl font-black active:scale-95 disabled:opacity-30"
              >
                ✕
              </button>

              <button
                onClick={handleVButtonClick}
                className="flex-1 bg-violet-600/70 hover:bg-violet-500/90 text-white hover:text-emerald-300 transition-all duration-300 flex items-center justify-center text-2xl font-black active:scale-95 disabled:opacity-30"
              >
                ✓
              </button>
            </div>
          </div>

          <button
            onClick={nextSlide}
            className="w-20 h-20 rounded-full bg-violet-600/90 flex items-center justify-center text-4xl text-white hover:bg-violet-500 hover:scale-110 transition-all z-40"
          >
            →
          </button>
        </div>
      </main>

      {/* 하단 네비 */}
      <nav
        className="
          fixed bottom-0 left-0 right-0
          bg-black/50
          backdrop-blur-2xl
          border-t border-purple-500/10
          z-40
        "
      >
        <div
          className="
            max-w-6xl mx-auto
            flex justify-center items-center
            gap-24
            py-5
          "
        >
          <button
            onClick={() => navigate('/')}
            className="
              flex flex-col items-center gap-1
              text-violet-400 scale-110
            "
          >
            <HomeIcon size={26} />
            <span className="text-xs font-bold">
              홈
            </span>
          </button>

          <button
            onClick={() => navigate('/my-chats')}
            className="
              flex flex-col items-center gap-1
              text-stone-500 hover:text-white
              transition-all duration-300
            "
          >
            <MessageCircle size={26} />
            <span className="text-xs font-medium">
              채팅
            </span>
          </button>

          <button
            onClick={() => navigate('/mypage')}
            className="
              flex flex-col items-center gap-1
              text-stone-500 hover:text-white
              transition-all duration-300
            "
          >
            <User size={26} />
            <span className="text-xs font-medium">
              마이페이지
            </span>
          </button>
        </div>
      </nav>

      {/* 매칭 성공 모달 */}
      {matchedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md bg-[#12091f] border border-violet-500/20 rounded-[32px] p-8 text-center shadow-[0_0_80px_rgba(124,58,237,0.45)]">
            <button
              onClick={() => setMatchedProfile(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 text-stone-400 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-5 w-28 h-28 rounded-full overflow-hidden border-2 border-violet-400/50 shadow-[0_0_35px_rgba(124,58,237,0.6)]">
              <img
                src={matchedProfile.img}
                alt={matchedProfile.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h2 className="text-4xl font-black text-white mb-3">
              매칭 성공!
            </h2>

            <p className="text-stone-300 mb-2">
              <span className="text-violet-300 font-bold">
                {matchedProfile.name}
              </span>
              님도 나를 선택했어요.
            </p>

            <p className="text-sm text-stone-500 mb-8">
              이제 채팅을 통해 함께 플레이할 시간을 정해보세요.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMatchedProfile(null)}
                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-stone-300 font-bold hover:bg-white/10 transition-all"
              >
                계속 보기
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem('selectedChat');
                  sessionStorage.setItem(
                    'currentMatch',
                    JSON.stringify({
                      id: matchedProfile.id,
                      userId: matchedProfile.id,
                      name: matchedProfile.name,
                      tag: matchedProfile.tag || 'KR1',
                      img: matchedProfile.img,
                    })
                  );
                  setMatchedProfile(null);
                  navigate('/chat');
                }}
                className="flex-1 py-4 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_30px_rgba(124,58,237,0.4)]"
              >
                <MessageCircle size={18} />
                채팅하기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}