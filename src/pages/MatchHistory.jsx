import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MatchHistory() {
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedChats =
      JSON.parse(localStorage.getItem('chatHistory')) || [];

    const savedRatings =
      JSON.parse(localStorage.getItem('savedRatings')) || [];

    const formatted = savedChats.map((chat) => {
      const existingRating = savedRatings.find(
        (rating) => Number(rating.id) === Number(chat.userId)
      );

      return {
        id: chat.userId,
        name: chat.name,
        tag: chat.tag || 'KR1',
        date: chat.endedAt,
        img: chat.img,
        rating: existingRating ? existingRating.rating : 0,
        isRated: !!existingRating
      };
    });

    setHistory(formatted);
  }, []);

  const handleStarClick = (matchId, newRating) => {
    setHistory((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;

        if (m.isRated) return m;

        return {
          ...m,
          rating: newRating
        };
      })
    );
  };

  const handleSave = () => {
    const savedRatings =
      JSON.parse(localStorage.getItem('savedRatings')) || [];

    const newRatings = history
      .filter((match) => match.rating > 0 && !match.isRated)
      .map((match) => ({
        id: match.id,
        name: match.name,
        tag: match.tag,
        rating: match.rating,
        ratedAt: new Date().toLocaleString('ko-KR')
      }));

    if (newRatings.length === 0) {
      alert('새로 평가할 별점이 없습니다.');
      return;
    }

    const mergedRatings = [
      ...savedRatings,
      ...newRatings
    ];

    localStorage.setItem(
      'savedRatings',
      JSON.stringify(mergedRatings)
    );

    setHistory((prev) =>
      prev.map((match) => {
        const rated = newRatings.find(
          (r) => Number(r.id) === Number(match.id)
        );

        return rated
          ? { ...match, isRated: true }
          : match;
      })
    );

    alert('별점 평가가 저장되었습니다! 🌟');
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      <header className="
        relative z-10
        flex items-center gap-4
        px-6 py-6
        border-b border-white/10
        bg-black/20 backdrop-blur-xl
      ">
        <button
          onClick={() => navigate(-1)}
          className="
            p-2 rounded-full
            hover:bg-white/10
            transition-all
          "
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-2">
          <History size={20} className="text-violet-400" />

          <h1 className="text-2xl font-black tracking-tight">
            매칭 히스토리
          </h1>
        </div>
      </header>

      <main className="
        relative z-10
        max-w-4xl mx-auto
        px-6 py-8
        space-y-5
      ">

        {history.length === 0 && (
          <div className="
            bg-white/5
            border border-white/10
            rounded-[32px]
            p-10 text-center
          ">
            <History
              size={40}
              className="mx-auto text-violet-400 mb-4"
            />

            <h2 className="text-2xl font-black mb-2">
              아직 종료된 매칭이 없습니다
            </h2>

            <p className="text-stone-400">
              채팅 종료 후 상대방 평가가 가능합니다.
            </p>
          </div>
        )}

        {history.map((match) => (
          <div
            key={match.id}
            className="
              bg-white/5
              backdrop-blur-xl
              border border-white/10
              rounded-[32px]
              p-6
            "
          >
            <div className="flex items-center justify-between mb-5">

              <div className="flex items-center gap-4">
                <img
                  src={match.img}
                  alt={match.name}
                  className="
                    w-20 h-20 rounded-3xl
                    object-cover
                    border border-violet-500/30
                  "
                />

                <div>
                  <h2 className="text-2xl font-black">
                    {match.name}

                    <span className="ml-2 text-sm text-stone-500">
                      #{match.tag}
                    </span>
                  </h2>

                  <p className="text-sm text-stone-400 mt-2">
                    {match.date}
                  </p>
                </div>
              </div>

              {match.isRated && (
                <span className="
                  px-4 py-2 rounded-xl
                  bg-violet-500/15
                  border border-violet-500/20
                  text-violet-300
                  text-sm font-bold
                ">
                  평가 완료
                </span>
              )}

            </div>

            <div className="flex flex-col items-center gap-3">

              <span className="text-sm text-stone-400">
                {match.isRated
                  ? '내가 남긴 별점'
                  : '이 유저와의 플레이는 어떠셨나요?'}
              </span>

              <div className="flex gap-2 text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() =>
                      handleStarClick(match.id, star)
                    }
                    disabled={match.isRated}
                    className={`
                      transition-all duration-300
                      ${match.isRated
                        ? 'cursor-default'
                        : 'hover:scale-125'}
                    `}
                  >
                    <Star
                      size={34}
                      fill={
                        star <= match.rating
                          ? 'currentColor'
                          : 'none'
                      }
                      strokeWidth={
                        star <= match.rating ? 0 : 2
                      }
                      className={
                        star <= match.rating
                          ? 'drop-shadow-sm'
                          : 'text-stone-500'
                      }
                    />
                  </button>
                ))}
              </div>

              {match.isRated && (
                <p className="text-sm text-stone-500">
                  {match.rating}점을 남겼습니다.
                </p>
              )}

            </div>
          </div>
        ))}

        {history.some((match) => match.rating > 0 && !match.isRated) && (
          <button
            onClick={handleSave}
            className="
              w-full mt-8
              bg-violet-600 hover:bg-violet-500
              text-white rounded-2xl
              shadow-[0_0_35px_rgba(124,58,237,0.35)]
              transition-all duration-300
              py-4 font-black text-lg
              active:scale-[0.98]
            "
          >
            평가 저장하기
          </button>
        )}

      </main>
    </div>
  );
}