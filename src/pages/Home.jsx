import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col relative overflow-hidden">
      
      {/* 네비게이션 바 */}
      <header className="w-full max-w-7xl mx-auto px-10 py-6 flex items-center justify-between z-10">
        <div className="flex items-baseline gap-8">
          {/* 로고 (클릭 시 새로고침) */}
          <button 
            onClick={() => window.location.reload()}
            className="text-3xl font-black tracking-tight text-white select-none hover:text-stone-300 transition-colors"
          >
            FInd DUO
          </button>
          
          {/* 네비게이션 메뉴 */}
          <nav className="flex gap-6 text-sm font-medium text-stone-400">
            <a href="#service" className="hover:text-white transition-colors">서비스</a>
            <a href="#intro" className="hover:text-white transition-colors">소개</a>
            <a href="#download" className="hover:text-white transition-colors">다운로드</a>
          </nav>
        </div>
      </header>

      {/* 중앙 컨텐츠 영역 */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="flex flex-col gap-6 items-center">
          
          {/* 중앙 프로필 카드 */}
          <div
            className="
              relative
              w-[400px]
              h-[680px]
              rounded-3xl
              overflow-hidden
              bg-white
              border border-white/10
              shadow-[0_0_50px_rgba(0,0,0,0.8)]
              transition-all duration-300
              hover:scale-[1.01]
            "
          >
            {/* 프로필 이미지 */}
            <img
              src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=1200&auto=format&fit=crop"
              alt="profile"
              className="w-full h-full object-cover"
            />

            {/* 하단 정보 플레이트 */}
            <div
              className="
                absolute bottom-0 left-0 right-0
                p-6
                bg-black/40
                backdrop-blur-xl
                border-t border-white/10
              "
            >
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                김도건
              </h2>

              <p className="text-stone-200 mt-1.5 text-sm font-medium">
                Diamond 2 · 84LP · KR · 20세 · JUG
              </p>

              <p className="text-stone-300 mt-2 text-sm">
                듀오 구함
              </p>

              {/* 별점 */}
              <div
                className="
                  mt-4
                  inline-flex
                  items-center
                  gap-2
                  px-4 py-2
                  rounded-xl
                  bg-stone-900/80
                  backdrop-blur-md
                  border border-stone-800
                "
              >
                <span className="text-yellow-500 text-sm">
                  ★★★★
                </span>
                <span className="text-stone-300 text-xs font-semibold">
                  4.0 (24)
                </span>
              </div>
            </div>
          </div>

          {/* 하단 수락 / 거절 버튼 (오각형) */}
          <div className="flex gap-4 w-[400px] h-16">
            {/* X 버튼 */}
            <button 
              className="
                flex-1 
                bg-stone-900/90 hover:bg-stone-800 
                text-white hover:text-red-500 
                transition-all duration-300
                flex items-center justify-center 
                text-2xl font-black
                [clip-path:polygon(15%_0%,100%_0%,100%_100%,15%_100%,0%_50%)]
                active:scale-95
              "
            >
              ✕
            </button>

            {/* V 버튼 */}
            <button 
              className="
                flex-1 
                bg-violet-600/90 hover:bg-violet-500 
                text-white hover:text-emerald-400
                transition-all duration-300
                flex items-center justify-center 
                text-2xl font-black
                [clip-path:polygon(0%_0%,85%_0%,100%_50%,85%_100%,0%_100%)]
                active:scale-95
                shadow-[0_0_15px_rgba(124,58,237,0.3)]
              "
            >
              ✓
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
