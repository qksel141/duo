import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Home, MessageCircle, User, Star, X, History } from 'lucide-react';

const MyPage = () => {
  const navigate = useNavigate();

  const currentTier = "Challenger"; 
  const currentTag = "KR1";
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

 const getTierColor = (tier) => {
    const lower = tier.toLowerCase();
    
    // 💡 includes 대신 === (정확히 일치)를 사용하여 단어 겹침 버그를 완벽 해결했습니다!
    if (lower === 'iron') return 'text-stone-500';
    if (lower === 'bronze') return 'text-amber-700';
    if (lower === 'silver') return 'text-slate-400';
    if (lower === 'gold') return 'text-yellow-500';
    
    // 💡 플래티넘은 푸른빛 청록색(cyan), 에메랄드는 뚜렷한 초록색(green)으로 명확히 분리!
    if (lower === 'platinum') return 'text-cyan-500';
    if (lower === 'emerald') return 'text-green-500';
    
    if (lower === 'diamond') return 'text-blue-500';
    if (lower === 'master') return 'text-purple-500';
    if (lower === 'grandmaster') return 'text-red-500';
    
    if (lower === 'challenger') {
      return 'bg-gradient-to-r from-cyan-500 via-yellow-500 to-amber-500 text-transparent bg-clip-text font-black tracking-tight';
    }
    
    return 'text-stone-500'; 
  };

  const handleNotification = () => alert("새로운 알림이 없습니다.");
  const handleEditProfile = () => navigate('/edit-profile');
  const handleMannerScore = () => navigate('/manner-score');
  const handleMatchHistory = () => navigate('/match-history');
  
  const handleLogout = () => {
    const isConfirm = window.confirm("정말 로그아웃 하시겠습니까?");
    if (isConfirm) {
      alert("성공적으로 로그아웃 되었습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      <header className="flex items-center justify-between px-5 py-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">MY</h1>
        <button onClick={handleNotification} className="p-2 text-stone-500 hover:bg-white/50 rounded-full transition-all duration-300">
          <Bell size={24} />
        </button>
      </header>

      <main className="px-4 space-y-4">
        {/* 1. Profile Section */}
        <section 
          onClick={() => setIsProfileModalOpen(true)}
          className="bg-white/75 backdrop-blur-xl rounded-3xl p-6 shadow-md border border-white/30 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl cursor-pointer active:scale-[0.98]"
        >
          <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden mb-4 shadow-inner relative">
            <img src="https://i.namu.wiki/i/EZNaF5XmAKKF4LgVE_D0sBSaH1aalphJ5BDr9uGBLqiuxwyzTZygUkCPgTOAhqyn6wBRonLpdkxSQ_EWxfrER-JzvuFbc6m8TjEQXM-ERJzvyTcGPcNlJj3KoxBFHvEfESfntDdLIP_Vu1pWadJUQg.webp" alt="프로필 이미지" className="w-full h-full object-cover" />
          </div>
          <div className="space-y-1 mb-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 flex items-center justify-center gap-1">
              윤재 <span className="text-base font-normal text-stone-400">#{currentTag}</span>
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm text-stone-700">
              <span className={`font-extrabold ${getTierColor(currentTier)}`}>{currentTier}</span>
              <span className="text-stone-300">|</span><span>KR 서버</span>
            </div>
          </div>
          <p className="text-stone-600 bg-stone-50 px-4 py-2 rounded-2xl w-full text-sm">
            즐겁게 듀오하실 분 찾아요! 멘탈 좋습니다 😊
          </p>
          <p className="text-[10px] text-stone-400 mt-3 flex items-center justify-center gap-1">
            카드를 눌러 상세 프로필 보기 <ChevronRight size={12} />
          </p>
        </section>

        {/* 2. Manner Score Card */}
        <section 
          onClick={handleMannerScore}
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:bg-white/90 cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-stone-700">매너 점수</h3>
            {/* 💡 직관적인 상세보기 뱃지 */}
            <span className="flex items-center gap-1 bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-stone-200">
              상세보기 <ChevronRight size={12} />
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black text-stone-900 tracking-tight">
                4.8 <span className="text-sm font-medium text-stone-500">/ 5.0</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">128명 평가</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex text-yellow-400">
                <Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" /><Star size={18} fill="currentColor" opacity={0.5} />
              </div>
              <span className="text-[10px] font-bold text-violet-500 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                매우 좋아요
              </span>
            </div>
          </div>
        </section>

        {/* 3. Match History Card */}
        <section 
          onClick={handleMatchHistory}
          className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-md p-5 transition-all duration-300 hover:shadow-xl hover:bg-white/90 cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History size={18} className="text-violet-500" />
              <h3 className="text-sm font-bold text-stone-800">최근 매칭 히스토리</h3>
            </div>
            {/* 💡 직관적인 평가하기 뱃지 */}
            <span className="flex items-center gap-1 bg-stone-100 text-stone-500 px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm border border-stone-200">
              평가하기 <ChevronRight size={12} />
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium">최근 함께 플레이한 유저 2명이 있습니다. 별점을 남겨주세요!</p>
        </section>

        {/* 4. Menu Section */}
        <section className="space-y-3 pt-2">
          <MenuButton title="프로필 수정" onClick={handleEditProfile} />
          <MenuButton title="로그아웃" isLogout={true} onClick={handleLogout} />
        </section>
      </main>

      {/* Profile Detail Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-stone-900">상세 프로필</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl">
                <span className="text-sm font-medium text-stone-500">주 게임 모드</span>
                <span className="font-bold text-violet-500">랭크 게임</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl">
                <span className="text-sm font-medium text-stone-500">주 포지션</span>
                <span className="font-bold text-stone-800">미드 (Mid)</span>
              </div>
              <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl">
                <span className="text-sm font-medium text-stone-500">플레이 스타일</span>
                <span className="font-bold text-orange-500">빡겜 모드 🔥</span>
              </div>
            </div>
            <button onClick={() => { setIsProfileModalOpen(false); navigate('/edit-profile'); }} className="w-full mt-6 bg-stone-900 text-white font-bold py-4 rounded-2xl hover:bg-stone-800">
              프로필 수정하러 가기
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-stone-200 z-40">
        <div className="flex justify-around items-center py-4">
          <button className="flex flex-col items-center space-y-1 text-stone-400 hover:text-stone-600">
            <Home size={24} />
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-stone-400 hover:text-stone-600">
            <MessageCircle size={24} />
            <span className="text-[10px] font-medium">채팅</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-violet-500 scale-110">
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
    <button onClick={onClick} className="w-full flex items-center justify-between bg-white/70 rounded-2xl shadow-sm border border-white/30 p-4 transition-all hover:bg-white hover:shadow-md active:scale-[0.98]">
      <span className={`text-base font-medium ${isLogout ? 'text-stone-500' : 'text-stone-700'}`}>{title}</span>
      <ChevronRight size={20} className="text-stone-400" />
    </button>
  );
};

export default MyPage;