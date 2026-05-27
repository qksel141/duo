import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createRating, fetchRatings } from '../api/users'; // 💡 가져오기 기능 추가!

const MatchHistory = () => {
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([
    { id: 2, name: '페이커', tag: 'T1', date: '오늘 14:30', rating: 0 },
    { id: 3, name: '쵸비', tag: 'GEN', date: '어제 20:15', rating: 0 },
    { id: 4, name: '데프트', tag: 'KT', date: '3일 전', rating: 0 },
  ]);

  // 💡 화면이 켜질 때, DB에 저장된 내 별점 기록을 가져와서 덧칠해 줍니다!
  useEffect(() => {
    const loadSavedRatings = async () => {
      try {
        const savedRatings = await fetchRatings();
        
        setHistory(prevHistory => 
          prevHistory.map(match => {
            // 내가(1번) 이 유저(match.id)에게 줬던 기록을 찾습니다.
            const myRating = savedRatings.find(
              r => r.from_user_id === 1 && r.to_user_id === match.id
            );
            // 기록이 있으면 그 점수로 바꿔주고, 없으면 그대로 둡니다.
            return myRating ? { ...match, rating: myRating.score } : match;
          })
        );
      } catch (error) {
        console.error("별점 기록을 불러오지 못했습니다.", error);
      }
    };
    loadSavedRatings();
  }, []);

  const handleStarClick = (matchId, newRating) => {
    setHistory(prev => prev.map(m => m.id === matchId ? { ...m, rating: newRating } : m));
  };

  const handleSave = async () => {
    const ratedMatches = history.filter(match => match.rating > 0);

    if (ratedMatches.length === 0) {
      alert("평가할 별점을 최소 1개 이상 선택해 주세요!");
      return;
    }

    try {
      for (const match of ratedMatches) {
        await createRating({
          from_user_id: 1,
          to_user_id: match.id,
          match_id: 100 + match.id,
          score: match.rating
        });
      }

      alert("별점 평가가 DB에 성공적으로 저장되었습니다! 🌟");
      navigate(-1);
      
    } catch (error) {
      alert(`평가 저장 실패: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      <header className="flex items-center px-5 py-6 space-x-4 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-stone-200/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-500 hover:bg-white rounded-full transition-all duration-300">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <History size={20} className="text-violet-500" />
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900">최근 매칭 히스토리</h1>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-4">
        <p className="text-sm font-bold text-stone-500 ml-1 mb-4">
          최근 함께 게임을 플레이한 유저를 평가해 주세요.
        </p>

        <div className="space-y-4">
          {history.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-200/50 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-stone-800">
                    {match.name} <span className="text-sm font-medium text-stone-400">#{match.tag}</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-md">{match.date} 매칭됨</span>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-2 pt-1">
                <span className="text-xs font-bold text-stone-500">이 유저와의 플레이는 어떠셨나요?</span>
                <div className="flex gap-2 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => handleStarClick(match.id, star)} className="focus:outline-none transition-all duration-300 hover:scale-125 active:scale-90">
                      <Star size={32} fill={star <= match.rating ? "currentColor" : "none"} strokeWidth={star <= match.rating ? 0 : 2} className={star <= match.rating ? "drop-shadow-sm" : "text-stone-300"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} className="w-full mt-8 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl shadow-lg transition-all duration-300 py-4 font-bold text-lg active:scale-[0.98]">
          평가 저장하기
        </button>
      </main>
    </div>
  );
};

export default MatchHistory;