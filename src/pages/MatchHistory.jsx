import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRating, fetchRatings } from '../api/users';

const defaultHistory = [
  { id: 2, name: '페이커', tag: 'T1', date: '오늘 14:30', rating: 0 },
  { id: 3, name: '쵸비', tag: 'GEN', date: '어제 20:15', rating: 0 },
  { id: 4, name: '데프트', tag: 'KT', date: '3일 전', rating: 0 },
];

const MatchHistory = () => {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      const savedHistory =
        JSON.parse(localStorage.getItem('matchHistory')) || [];

      const mergedHistory = [...savedHistory, ...defaultHistory];

      try {
        const savedRatings = await fetchRatings();

        const historyWithRatings = mergedHistory.map((match) => {
          const myRating = savedRatings.find(
            (r) => r.from_user_id === 1 && r.to_user_id === match.id
          );

          return myRating
            ? { ...match, rating: myRating.score }
            : match;
        });

        setHistory(historyWithRatings);
      } catch (error) {
        console.error('별점 기록을 불러오지 못했습니다.', error);
        setHistory(mergedHistory);
      }
    };

    loadHistory();
  }, []);

  const handleStarClick = (matchId, newRating) => {
    setHistory((prev) =>
      prev.map((match) =>
        match.id === matchId
          ? { ...match, rating: newRating }
          : match
      )
    );
  };

  const handleSave = async () => {
    const ratedMatches = history.filter((match) => match.rating > 0);

    if (ratedMatches.length === 0) {
      alert('평가할 별점을 최소 1개 이상 선택해 주세요!');
      return;
    }

    try {
      for (const match of ratedMatches) {
        await createRating({
          from_user_id: 1,
          to_user_id: match.id,
          match_id: 100 + match.id,
          score: match.rating,
        });
      }

      alert('별점 평가가 DB에 성공적으로 저장되었습니다! 🌟');
      navigate(-1);
    } catch (error) {
      alert(`평가 저장 실패: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      {/* 배경 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes bg-wave {
            0% {
              transform: translateX(5%) translateY(-5%) scale(1);
            }
            50% {
              transform: translateX(-10%) translateY(5%) scale(1.08);
            }
            100% {
              transform: translateX(5%) translateY(-5%) scale(1);
            }
          }

          .animate-bg-wave {
            animation: bg-wave 14s infinite ease-in-out;
          }
        `}</style>

        <div className="absolute top-[10%] -right-[15%] w-[45vw] h-[35vh] rounded-full bg-violet-600/20 blur-[140px] animate-bg-wave" />

        <div
          className="absolute bottom-[10%] -left-[15%] w-[40vw] h-[30vh] rounded-full bg-fuchsia-500/15 blur-[140px] animate-bg-wave"
          style={{ animationDelay: '-4s' }}
        />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[25vh] bg-purple-500/10 rounded-full blur-[160px]" />
      </div>

      {/* 헤더 */}
      <header className="
        sticky top-0 z-30
        backdrop-blur-xl
        bg-black/20
        border-b border-white/10
      ">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">

          <button
            onClick={() => navigate(-1)}
            className="
              w-11 h-11 rounded-2xl
              bg-white/5 border border-white/10
              flex items-center justify-center
              text-stone-300
              hover:bg-violet-500/20
              hover:text-white
              transition-all duration-300
            "
          >
            <ArrowLeft size={22} />
          </button>

          <div className="flex items-center gap-3">
            <div className="
              w-11 h-11 rounded-2xl
              bg-violet-500/15
              border border-violet-500/20
              flex items-center justify-center
            ">
              <History size={20} className="text-violet-300" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Match History
              </h1>

              <p className="text-sm text-stone-400">
                최근 함께 플레이한 유저 평가
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* 메인 */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">

        <div className="mb-6">
          <p className="text-stone-400 font-medium">
            최근 함께 게임을 플레이한 유저를 평가해 주세요.
          </p>
        </div>

        <div className="space-y-5">
          {history.length === 0 && (
            <div className="
              bg-white/5
              border border-white/10
              rounded-[28px]
              p-8
              text-center
              text-stone-400
            ">
              아직 매칭 히스토리가 없습니다.
            </div>
          )}

          {history.map((match) => (
            <div
              key={`${match.id}-${match.date}`}
              className="
                bg-white/5
                backdrop-blur-xl
                border border-white/10
                rounded-[28px]
                p-6
                transition-all duration-300
                hover:border-violet-500/30
                hover:bg-white/[0.07]
                hover:shadow-[0_0_40px_rgba(124,58,237,0.15)]
              "
            >

              <div className="
                flex items-center justify-between
                border-b border-white/10
                pb-4 mb-5
              ">

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {match.name}

                    <span className="ml-2 text-base font-medium text-stone-500">
                      #{match.tag}
                    </span>
                  </h2>

                  <p className="text-sm text-stone-400 mt-1">
                    최근 듀오 플레이 유저
                  </p>
                </div>

                <div className="
                  px-3 py-1.5 rounded-xl
                  bg-white/5 border border-white/10
                  text-xs font-bold text-stone-300
                ">
                  {match.date}
                </div>

              </div>

              <div className="flex flex-col items-center gap-4">

                <span className="text-sm font-bold text-stone-400">
                  플레이 만족도를 평가해주세요
                </span>

                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(match.id, star)}
                      className="
                        transition-all duration-300
                        hover:scale-125
                        active:scale-90
                      "
                    >
                      <Star
                        size={34}
                        fill={star <= match.rating ? 'currentColor' : 'none'}
                        strokeWidth={star <= match.rating ? 0 : 2}
                        className={
                          star <= match.rating
                            ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                            : 'text-stone-600'
                        }
                      />
                    </button>
                  ))}
                </div>

                {match.rating > 0 && (
                  <div className="
                    px-4 py-2 rounded-xl
                    bg-violet-500/15
                    border border-violet-500/20
                    text-violet-300
                    text-sm font-bold
                  ">
                    {match.rating}점 선택됨
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="
            w-full mt-10
            bg-violet-600 hover:bg-violet-500
            text-white
            rounded-3xl
            py-5
            text-lg font-black
            transition-all duration-300
            hover:scale-[1.01]
            active:scale-[0.98]
            shadow-[0_0_35px_rgba(124,58,237,0.4)]
          "
        >
          평가 저장하기
        </button>

      </main>

    </div>
  );
};

export default MatchHistory;