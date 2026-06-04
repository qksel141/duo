import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  ThumbsUp,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ✅ 백엔드 데이터 호출을 위한 함수와 내 ID 가져오기 도구 추가
import { fetchUserById } from '../api/users';
import { getCurrentUserId } from '../auth';

const MannerScoreDetail = () => {
  const navigate = useNavigate();
  const myId = getCurrentUserId();
  
  // ✅ 백엔드 데이터를 담을 공간(State) 생성
  const [userData, setUserData] = useState(null);

  // ✅ 페이지가 열릴 때 백엔드에서 내 정보 가져오기
  useEffect(() => {
    if (!myId) return;
    
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserById(myId);
        if (!cancelled) setUserData(data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [myId]);

  // 데이터를 불러오는 동안 보여줄 화면
  if (!userData) {
    return (
      <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-stone-400 font-bold">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      {/* 배경 */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes bg-wave {
            0% { transform: translateX(5%) translateY(-5%) scale(1); }
            50% { transform: translateX(-10%) translateY(5%) scale(1.08); }
            100% { transform: translateX(5%) translateY(-5%) scale(1); }
          }
          .animate-bg-wave { animation: bg-wave 14s infinite ease-in-out; }
        `}</style>
        <div className="absolute top-[10%] -right-[15%] w-[45vw] h-[35vh] rounded-full bg-violet-600/20 blur-[140px] animate-bg-wave" />
        <div
          className="absolute bottom-[10%] -left-[15%] w-[40vw] h-[30vh] rounded-full bg-fuchsia-500/15 blur-[140px] animate-bg-wave"
          style={{ animationDelay: '-4s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35vw] h-[25vh] bg-purple-500/10 rounded-full blur-[160px]" />
      </div>

      {/* 헤더 */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-stone-300 hover:bg-violet-500/20 hover:text-white transition-all duration-300"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Manner Score</h1>
            <p className="text-sm text-stone-400">유저 매너 평가 상세</p>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-8">

        {/* 점수 카드 */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(124,58,237,0.15)]">
          <span className="px-4 py-2 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-300 text-sm font-bold mb-5">
            종합 매너 점수
          </span>

          <div className="flex items-end gap-2 mb-4">
            {/* ✅ 백엔드 점수 연동 */}
            <span className="text-7xl font-black bg-gradient-to-r from-white to-stone-400 text-transparent bg-clip-text">
              {Number(userData.rating || 0).toFixed(1)}
            </span>
            <span className="text-2xl text-stone-500 mb-2">/ 5.0</span>
          </div>

          {/* ✅ 상세 별점 게이지 연동 */}
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => {
              const score = Number(userData.rating || 0);
              const fillPercent = Math.max(0, Math.min(100, (score - star + 1) * 100));
              return (
                <div key={star} className="relative">
                  <Star size={28} className="text-stone-700" />
                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
                    <Star size={28} className="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ 평가 인원수 연동 */}
          <p className="text-stone-400 font-medium">
            총 {userData.rating_count || 0}명의 듀오가 평가했어요
          </p>
        </section>

        {/* 칭찬 배지 */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Praise Badges</h2>
              <p className="text-sm text-stone-400 mt-1">함께 플레이한 유저들의 평가</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 카드 1 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 flex items-center justify-between transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.07] hover:shadow-[0_0_40px_rgba(124,58,237,0.15)]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                  <ThumbsUp size={24} className="text-violet-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">실력이 뛰어나요</h3>
                  <p className="text-sm text-stone-400">게임 이해도가 높고 플레이가 안정적이에요</p>
                </div>
              </div>
              {/* ✅ 뱃지 1 카운트 연동 */}
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-200 font-black">
                {userData.badge_skill || 0}명
              </div>
            </div>

            {/* 카드 2 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 flex items-center justify-between transition-all duration-300 hover:border-pink-500/30 hover:bg-white/[0.07]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
                  <MessageSquare size={24} className="text-pink-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">소통이 잘 돼요</h3>
                  <p className="text-sm text-stone-400">브리핑과 오더가 깔끔해요</p>
                </div>
              </div>
              {/* ✅ 뱃지 2 카운트 연동 */}
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-200 font-black">
                {userData.badge_comm || 0}명
              </div>
            </div>

            {/* 카드 3 */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-5 flex items-center justify-between transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.07]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                  <Shield size={24} className="text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">멘탈이 좋아요</h3>
                  <p className="text-sm text-stone-400">분위기를 편안하게 만들어줘요</p>
                </div>
              </div>
              {/* ✅ 뱃지 3 카운트 연동 */}
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-stone-200 font-black">
                {userData.badge_mental || 0}명
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MannerScoreDetail;