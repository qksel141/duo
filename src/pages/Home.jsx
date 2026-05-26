import React, { useEffect, useState } from 'react';
import { fetchUsers, toProfile } from '../api/users';

function renderStars(rating) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return '★★★★★'.slice(0, safe) + '☆☆☆☆☆'.slice(0, 5 - safe);
}

export default function Home() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vAnimState, setVAnimState] = useState('');

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

  const profileCount = profiles.length;

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
    setVAnimState('zoom');
    setTimeout(() => {
      setVAnimState('fly-right');
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % profileCount);
        setVAnimState('');
      }, 500);
    }, 200);
  };

  const handleXButtonClick = () => {
    if (vAnimState !== '' || profileCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % profileCount);
  };

  const getCardStyles = (index) => {
    let diff = index - currentIndex;
    const len = profileCount;

    if (diff < -Math.floor(len / 2)) diff += len;
    if (diff > Math.floor(len / 2)) diff -= len;

    if (diff === 0) {
      let baseStyles = "z-30 opacity-100 scale-100 translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.8)]";
      if (vAnimState === 'zoom') {
        return baseStyles + " !duration-200 !scale-[1.06] !shadow-[0_0_80px_rgba(124,58,237,0.6)]";
      }
      if (vAnimState === 'fly-right') {
        return baseStyles + " !duration-500 !translate-x-[70vw] !-translate-y-[70vh] !scale-10 !opacity-0 !rotate-12 pointer-events-none";
      }
      return baseStyles + " hover:scale-[1.01]";
    }

    if (diff === 1) {
      return "z-20 opacity-35 scale-75 translate-x-[260px] pointer-events-none rotate-3 blur-[1px]";
    }
    if (diff === -1) {
      return "z-20 opacity-35 scale-75 -translate-x-[260px] pointer-events-none -rotate-3 blur-[1px]";
    }
    if (diff > 1) {
      return "z-10 opacity-0 scale-50 translate-x-[500px] pointer-events-none";
    }
    return "z-10 opacity-0 scale-50 -translate-x-[500px] pointer-events-none";
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">
      
      
      {/*파도(Wave-Flow) 배경 레이어 */}
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <style>{`
          /* 1. 오른쪽 중간 ➔ 왼쪽 중간으로 칼날처럼 훑고 지나가는 쾌속 스피드 스트림 */
          @keyframes wave-stream-horizontal {
            0% { 
              transform: translateX(110vw); 
              opacity: 0; 
            }
            5% { opacity: 0.6; }
            95% { opacity: 0.6; }
            100% { 
              transform: translateX(-100vw); 
              opacity: 0; 
            }
          }

          /* 2. 배경 오로라 덩어리가 좌우로 출렁이는 횡형 웨이브 효과 */
          @keyframes bg-wave-leftright {
            0% { transform: translateX(5%) translateY(-5%) scale(1); }
            50% { transform: translateX(-10%) translateY(5%) scale(1.1); }
            100% { transform: translateX(5%) translateY(-5%) scale(1); }
          }

          .animate-bg-wave { animation: bg-wave-leftright 14s infinite ease-in-out; }
          
          .wave-line {
            position: absolute;
            /* 가로로 길게 찢어진 칼날 형태의 라이팅 파티클 */
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
        
        
        <div className="absolute top-[40%] -left-[20%] w-[70vw] h-[45vh] rounded-[100px] bg-gradient-to-r from-indigo-600/15 via-violet-600/5 to-transparent blur-[130px] animate-bg-wave" style={{ animationDelay: '-4s' }} />
        
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[30vh] rounded-full bg-purple-500/5 blur-[160px]" />
      </div>

      {/* 네비게이션 바 */}
      <header className="w-full max-w-[90%] xl:max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex items-center justify-between z-50">
        <div className="flex items-baseline gap-10">
          <button
            onClick={() => window.location.reload()}
            className="text-3xl font-black tracking-tight text-white select-none hover:text-purple-300 transition-colors"
          >
            FInd DUO
          </button>

          <nav className="flex gap-8 text-sm font-medium text-stone-400">
            <a href="#service" className="hover:text-white transition-colors">서비스</a>
            <a href="#intro" className="hover:text-white transition-colors">소개</a>
            <a href="#download" className="hover:text-white transition-colors">다운로드</a>
          </nav>
        </div>

        <div>
          <button className="
            px-6 py-2 text-xl font-black tracking-tight
            text-white hover:text-purple-300 transition-colors duration-300
          ">
            마이페이지
          </button>
        </div>
      </header>

      {/* 중앙 컨텐츠 영역 */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12 select-none z-10">
        <div className="flex items-center gap-16 relative max-w-6xl w-full justify-center">

          {/* [효과 1] 왼쪽 스와이프 화살표 버튼 */}
          <button
            onClick={prevSlide}
            className="
              w-20 h-20 rounded-full bg-stone-950/40 border border-purple-500/20
              shadow-[0_0_20px_rgba(0,0,0,0.3)] flex items-center justify-center text-4xl text-stone-400
              transition-all duration-300 hover:bg-purple-900/40 hover:text-white hover:border-purple-500/40
              hover:scale-110 active:scale-95 backdrop-blur-xl z-40
            "
          >
            <span className="mb-1">←</span>
          </button>

          {/* 중앙 카드 배치판 */}
          <div className="flex flex-col gap-6 items-center">

            {/* 회전초밥용 absolute 컨테이너 */}
            <div className="relative w-[400px] h-[680px] flex items-center justify-center">
              {loading && (
                <div className="text-stone-400 text-sm">
                  유저 정보를 불러오는 중...
                </div>
              )}

              {!loading && error && (
                <div className="text-red-400 text-sm text-center px-6">
                  유저 정보를 불러오지 못했어요.<br />
                  <span className="text-stone-500 text-xs">{error}</span>
                </div>
              )}

              {!loading && !error && profileCount === 0 && (
                <div className="text-stone-400 text-sm">
                  표시할 유저가 없어요.
                </div>
              )}

              {!loading && !error && profiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className={`
                    absolute inset-0 rounded-3xl overflow-hidden bg-stone-900/90
                    border border-white/10 transition-all duration-500 ease-in-out
                    ${getCardStyles(index)}
                  `}
                >
                  <img src={profile.img} alt={profile.name} className="w-full h-full object-cover pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent backdrop-blur-sm border-t border-white/5">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{profile.name}</h2>
                    <p className="text-stone-200 mt-1.5 text-sm font-medium">{profile.rank}</p>
                    <p className="text-stone-300 mt-2 text-sm">{profile.msg}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-950/80 border border-stone-800">
                      <span className="text-yellow-500 text-sm">{renderStars(profile.rating)}</span>
                      <span className="text-stone-300 text-xs font-semibold">
                        {profile.rating.toFixed(1)} ({profile.ratingCount})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 조작 버튼 (오각형) */}
            <div className="flex gap-4 w-[400px] h-16 z-40">
              {/* X 버튼 */}
              <button
                onClick={handleXButtonClick}
                className="
                  flex-1 bg-stone-950/40 hover:bg-stone-900/60 backdrop-blur-xl
                  text-white hover:text-red-500 border border-purple-500/10 transition-all duration-300
                  flex items-center justify-center text-2xl font-black
                  [clip-path:polygon(15%_0%,100%_0%,100%_100%,15%_100%,0%_50%)]
                  active:scale-95
                "
              >
                ✕
              </button>

              {/* V 버튼 */}
              <button
                onClick={handleVButtonClick}
                className="
                  flex-1 bg-violet-600/70 hover:bg-violet-500/90 backdrop-blur-xl
                  text-white hover:text-emerald-300 transition-all duration-300
                  flex items-center justify-center text-2xl font-black
                  [clip-path:polygon(0%_0%,85%_0%,100%_50%,85%_100%,0%_100%)]
                  active:scale-95 shadow-[0_0_35px_rgba(124,58,237,0.5)]
                "
              >
                ✓
              </button>
            </div>

          </div>

          {/* [효과 1] 오른쪽 스와이프 화살표 버튼 */}
          <button
            onClick={nextSlide}
            className="
              w-20 h-20 rounded-full bg-violet-600/90 shadow-[0_0_25px_rgba(124,58,237,0.4)]
              flex items-center justify-center text-4xl text-white border border-purple-400/20
              transition-all duration-300 hover:bg-violet-500 hover:scale-110 hover:shadow-[0_0_35px_rgba(124,58,237,0.6)]
              active:scale-95 z-40 backdrop-blur-md
            "
          >
            <span className="mb-1">→</span>
          </button>

        </div>
      </main>
    </div>
  );
}