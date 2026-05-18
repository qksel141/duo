
import React from 'react';

export default function Main() {
  // 화면에 띄울 예시 데이터
  const userData = {
    nickname: '심규찬',
    tier: 'GOLD 1 · 77LP',
    info: 'KR · 21세 · ',
    intro: '게임 즐겁게 함께할 듀오 구해요 ',
    likes: 53,
    rating: '4.1',
    ratingCount: 248,
    profileImage: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=1200&auto=format&fit=crop'
  };

  return (
    // 우선순위 1: 배경색 (어두운 stone-950 테마 적용)
    <div className="min-h-screen bg-stone-950 text-white flex flex-col relative overflow-hidden font-sans">
      
      {/* 네비게이션 바 */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10 border-b border-stone-900">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-black tracking-tight text-violet-500 select-none">
            LoL DUO
          </h1>
          <p className="text-stone-500 text-xs hidden sm:block">
            LoL 듀오 매칭 서비스
          </p>
        </div>
        <nav className="flex gap-6 text-sm font-medium text-stone-400">
          <a href="#service" className="hover:text-white transition-colors">서비스</a>
          <a href="#intro" className="hover:text-white transition-colors">소개</a>
          <button className="text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 px-3 py-1.5 rounded-full hover:bg-violet-600 hover:text-white transition-all">
            로그인
          </button>
        </nav>
      </header>

      {/* 중앙 정렬 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        
        {/* 우선순위 2: 프로필 카드 상자 */}
        <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300 hover:scale-[1.01]">
          
          {/* 프로필 이미지 영역 */}
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone-950">
            <img
              src={userData.profileImage}
              alt="profile"
              className="w-full h-full object-cover"
            />
            {/* 온라인 상태 뱃지 */}
            <div className="absolute top-4 left-4 bg-stone-900/80 backdrop-blur-md border border-stone-700 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              온라인
            </div>
          </div>

          {/* 하단 정보 플레이트 */}
          <div className="p-6 bg-stone-900 border-t border-stone-800">
            {/* 우선순위 3: 닉네임 / 티어 / 별점 */}
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {userData.nickname}
              </h2>
              <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
                #KR1
              </span>
            </div>

            <p className="text-stone-300 mt-1.5 text-sm font-semibold tracking-wide">
              {userData.tier} <span className="text-stone-500 font-normal">|</span> <span className="text-stone-400 font-normal text-xs">{userData.info}</span>
            </p>

            <p className="text-stone-400 mt-3 text-xs leading-relaxed bg-stone-950/50 p-3 rounded-xl border border-stone-800/60">
              {userData.intro}
            </p>

            {/* 별점 및 평가 레이아웃 */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-800/60 text-center">
              <div className="bg-stone-950/30 p-2 rounded-xl border border-stone-800/40">
                <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">받은 좋아요</p>
                <p className="text-sm font-bold text-violet-400 mt-0.5">{userData.likes}명</p>
              </div>
              <div className="bg-stone-950/30 p-2 rounded-xl border border-stone-800/40">
                <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">유저 평점</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-yellow-500 text-xs">★</span>
                  <p className="text-sm font-bold text-yellow-500">{userData.rating}</p>
                  <span className="text-[10px] text-stone-500">({userData.ratingCount})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우선순위 4: 하단 스와이프 버튼 UI */}
        <div className="flex items-center justify-center gap-4 mt-6 w-full max-w-sm px-2">
          
          {/* 넘기기 버튼 */}
          <button className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex flex-col items-center justify-center text-stone-500 transition-all duration-200 hover:bg-stone-800 hover:text-stone-300 hover:scale-110 active:scale-95 group">
            <span className="text-lg font-bold group-hover:rotate-45 transition-transform">⟳</span>
            <span className="text-[9px] -mt-1 font-medium text-stone-600 group-hover:text-stone-400">넘기기</span>
          </button>

          {/* 거절 버튼 */}
          <button className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 flex flex-col items-center justify-center text-red-500 shadow-lg transition-all duration-200 hover:bg-red-950/30 hover:border-red-800/50 hover:scale-110 active:scale-95">
            <span className="text-xl font-black">✕</span>
            <span className="text-[9px] font-medium text-stone-500">거절</span>
          </button>

          {/* 슈퍼라이크 버튼 */}
          <button className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex flex-col items-center justify-center text-blue-400 transition-all duration-200 hover:bg-blue-950/30 hover:border-blue-800/50 hover:scale-110 active:scale-95">
            <span className="text-base">★</span>
            <span className="text-[9px] -mt-0.5 font-medium text-stone-600">슈퍼라이크</span>
          </button>

          {/* 좋아요 버튼 */}
          <button className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 flex flex-col items-center justify-center text-green-400 shadow-lg transition-all duration-200 hover:bg-green-950/30 hover:border-green-800/50 hover:scale-110 active:scale-95">
            <span className="text-xl">♥</span>
            <span className="text-[9px] font-medium text-stone-500">좋아요</span>
          </button>

          {/* 부스트 버튼 */}
          <button className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex flex-col items-center justify-center text-violet-400 transition-all duration-200 hover:bg-violet-950/30 hover:border-violet-800/50 hover:scale-110 active:scale-95">
            <span className="text-lg">⚡</span>
            <span className="text-[9px] -mt-1 font-medium text-stone-600">부스트</span>
          </button>

        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-stone-600 mt-6 select-none tracking-wider">
          ☝ 좌우로 스와이프해서 다른 사람을 만나보세요!
        </p>
      </main>
    </div>
  );
}