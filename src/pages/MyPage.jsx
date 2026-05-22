import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Home, MessageCircle, User, Star } from 'lucide-react';

const MyPage = () => {
  const navigate = useNavigate();

  // 💡 테스트용 데이터: 이 글씨를 'Emerald 2', 'Gold 1' 등으로 바꿔보세요!
  const currentTier = "Challenger"; 
  
  // 💡 티어 이름에 따라 알맞은 색상(Tailwind 클래스)을 꺼내주는 규칙표입니다.
  const getTierColor = (tier) => {
    const lowerTier = tier.toLowerCase();
    
    if (lowerTier.includes('iron')) return 'text-stone-500';
    if (lowerTier.includes('bronze')) return 'text-amber-700';
    if (lowerTier.includes('silver')) return 'text-slate-400';
    // 골드는 기본 노란색
    if (lowerTier.includes('gold')) return 'text-yellow-500';
    if (lowerTier.includes('platinum')) return 'text-teal-500';
    if (lowerTier.includes('emerald')) return 'text-emerald-500';
    if (lowerTier.includes('diamond')) return 'text-blue-500';
    if (lowerTier.includes('master')) return 'text-purple-500';
    if (lowerTier.includes('grandmaster')) return 'text-red-500';
    
    // 챌린저
    if (lowerTier.includes('challenger')) {
      return 'bg-gradient-to-r from-cyan-500 via-yellow-500 to-amber-500 text-transparent bg-clip-text font-black tracking-tight';
    }
    
    return 'text-stone-500'; //언랭크 등 기본값
  };

  const handleNotification = () => alert("새로운 알림이 없습니다.");
  const handleEditProfile = () => navigate('/edit-profile');
  const handleMannerScore = () => navigate('/manner-score');
  
  const handleLogout = () => {
    const isConfirm = window.confirm("정말 로그아웃 하시겠습니까?");
    if (isConfirm) {
      alert("성공적으로 로그아웃 되었습니다.");
    }
  };

  const handleGoHome = () => alert("홈 화면으로 이동합니다.");
  const handleGoChat = () => alert("채팅 화면으로 이동합니다.");

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      {/* 1. Top Header */}
      <header className="flex items-center justify-between px-5 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">MY</h1>
        <button onClick={handleNotification} className="p-2 text-stone-500 hover:bg-white/50 rounded-full transition-all duration-300">
          <Bell size={24} />
        </button>
      </header>

      <main className="px-4 space-y-6">
        {/* 2. Profile Section */}
        <section className="bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-md border border-white/30 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl">
          <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden mb-4 shadow-inner">
            <img src="https://i.namu.wiki/i/EZNaF5XmAKKF4LgVE_D0sBSaH1aalphJ5BDr9uGBLqiuxwyzTZygUkCPgTOAhqyn6wBRonLpdkxSQ_EWxfrER-JzvuFbc6m8TjEQXM-ERJzvyTcGPcNlJj3KoxBFHvEfESfntDdLIP_Vu1pWadJUQg.webp" alt="프로필 이미지" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900">
              윤재 <span className="text-base font-normal text-stone-500">#KR1</span>
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm text-stone-700">
              {/* 💡 바로 여기서 규칙표(getTierColor)를 써서 색상을 입힙니다! */}
              <span className={`font-extrabold ${getTierColor(currentTier)}`}>
                {currentTier}
              </span>
              <span className="text-stone-300">|</span><span>KR 서버</span>
            </div>
          </div>
          <p className="text-stone-600 bg-stone-50 px-4 py-2 rounded-2xl w-full text-sm">
            즐겁게 듀오하실 분 찾아요! 멘탈 좋습니다 😊
          </p>
        </section>

        {/* 3. Manner Score Card */}
        <section className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 shadow-md p-5 flex items-center justify-between transition-all duration-300 hover:shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-stone-700 mb-1">매너 점수</h3>
            <p className="text-xl font-extrabold text-stone-900">
              4.8 <span className="text-sm font-normal text-stone-500">/ 5.0</span>
            </p>
            <p className="text-xs text-stone-500 mt-1">128명 평가</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex text-yellow-400 mb-2">
              <Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" opacity={0.5} />
            </div>
            <span className="text-sm font-bold text-violet-500 bg-violet-50 px-3 py-1 rounded-full">
              매우 좋아요
            </span>
          </div>
        </section>

        {/* 4. Menu Section */}
        <section className="space-y-3">
          <MenuButton title="프로필 수정" onClick={handleEditProfile} />
          <MenuButton title="매너점수 상세" onClick={handleMannerScore} />
          <MenuButton title="로그아웃" isLogout={true} onClick={handleLogout} />
        </section>
      </main>

      {/* 5. Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-stone-200">
        <div className="flex justify-around items-center py-4">
          <button onClick={handleGoHome} className="flex flex-col items-center space-y-1 text-stone-400 transition-all duration-300 hover:text-stone-600">
            <Home size={24} />
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button onClick={handleGoChat} className="flex flex-col items-center space-y-1 text-stone-400 transition-all duration-300 hover:text-stone-600">
            <MessageCircle size={24} />
            <span className="text-[10px] font-medium">채팅</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-violet-500 transition-all duration-300 scale-110">
            <User size={24} />
            <span className="text-[10px] font-bold">마이페이지</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

const MenuButton = ({ title, isLogout, onClick }) => {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between bg-white/70 rounded-2xl shadow-sm border border-white/30 p-4 transition-all duration-300 hover:bg-white hover:shadow-md active:scale-[0.98]">
      <span className={`text-base font-medium ${isLogout ? 'text-stone-500' : 'text-stone-700'}`}>{title}</span>
      <ChevronRight size={20} className="text-stone-400" />
    </button>
  );
};

export default MyPage;