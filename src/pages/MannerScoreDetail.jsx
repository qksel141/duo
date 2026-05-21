import React from 'react';
import { ArrowLeft, Star, ThumbsUp, MessageSquare, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 1. 뒤로가기 기능을 위해 추가됨

const MannerScoreDetail = () => {
  const navigate = useNavigate(); // 👈 2. 뒤로가기 기능 준비

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      {/* 1. 상단 뒤로가기 헤더 */}
      <header className="flex items-center px-5 py-6 space-x-4">
        {/* 👈 3. 여기에 뒤로가기 버튼 기능(onClick)이 연결되었습니다. */}
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-stone-500 hover:bg-white/50 rounded-full transition-all duration-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
          매너점수 상세
        </h1>
      </header>

      <main className="px-4 space-y-6">
        {/* 2. 종합 점수 대형 카드 */}
        <section className="bg-white/75 backdrop-blur-xl rounded-3xl p-8 shadow-md border border-white/30 flex flex-col items-center text-center">
          <h2 className="text-sm font-bold text-stone-500 mb-2">종합 매너 점수</h2>
          <div className="flex items-end justify-center space-x-1 mb-3">
            <span className="text-5xl font-extrabold text-stone-900">4.8</span>
            <span className="text-xl font-medium text-stone-400 mb-1">/ 5.0</span>
          </div>
          <div className="flex text-yellow-400 mb-3">
            <Star size={24} fill="currentColor" />
            <Star size={24} fill="currentColor" />
            <Star size={24} fill="currentColor" />
            <Star size={24} fill="currentColor" />
            <Star size={24} fill="currentColor" opacity={0.5} />
          </div>
          <p className="text-sm text-stone-500">총 128명의 듀오가 평가했어요</p>
        </section>

        {/* 3. 상세 리뷰 키워드 리스트 */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-stone-700 ml-1 mb-3">받은 칭찬 배지</h3>
          
          <div className="bg-white/70 rounded-2xl shadow-sm border border-white/30 p-4 flex items-center justify-between transition-all duration-300 hover:bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-violet-100 text-violet-500 rounded-xl">
                <ThumbsUp size={20} />
              </div>
              <span className="font-medium text-stone-700">실력이 뛰어나요</span>
            </div>
            <span className="text-stone-500 text-sm font-bold">84명</span>
          </div>

          <div className="bg-white/70 rounded-2xl shadow-sm border border-white/30 p-4 flex items-center justify-between transition-all duration-300 hover:bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 text-pink-500 rounded-xl">
                <MessageSquare size={20} />
              </div>
              <span className="font-medium text-stone-700">소통이 잘 돼요</span>
            </div>
            <span className="text-stone-500 text-sm font-bold">62명</span>
          </div>

          <div className="bg-white/70 rounded-2xl shadow-sm border border-white/30 p-4 flex items-center justify-between transition-all duration-300 hover:bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-stone-200 text-stone-600 rounded-xl">
                <Shield size={20} />
              </div>
              <span className="font-medium text-stone-700">멘탈이 좋아요</span>
            </div>
            <span className="text-stone-500 text-sm font-bold">45명</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MannerScoreDetail;