import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col relative overflow-hidden">
      
      {/* 네비게이션 바 */}
      <header className="w-full max-w-7xl mx-auto px-10 py-6 flex items-center justify-between z-10">
        <div className="flex items-baseline gap-8">
          {/*로고*/}
          <h1 className="text-3xl font-black tracking-tight text-white select-none">
            FInd DUO
          </h1>
          {/* 네비게이션 메뉴 */}
          <nav className="flex gap-6 text-sm font-medium text-stone-400">
            <a href="#service" className="hover:text-white transition-colors">서비스</a>
            <a href="#intro" className="hover:text-white transition-colors">소개</a>
            <a href="#download" className="hover:text-white transition-colors">다운로드</a>
          </nav>
        </div>
      </header>

      {/*중앙 정렬*/}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="flex items-center gap-8 relative max-w-4xl w-full justify-center">
          
          {/* 왼쪽 PASS 버튼 */}
          <button
            className="
              w-16 h-16
              rounded-full
              bg-stone-900/80
              border border-stone-800
              shadow-xl
              flex items-center justify-center
              text-xl
              text-stone-400
              transition-all duration-300
              hover:bg-stone-800
              hover:text-white
              hover:scale-110
              active:scale-95
              backdrop-blur-md
            "
          >
            ←
          </button>

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

            {/* 카드 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* 상단 롤 닉네임 / 티어 정보 */}
            <div className="absolute top-5 left-5 right-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-2xl text-amber-300">
                    🏆
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                      티어
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Platinum II
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  솔로랭크
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
                  롤 닉네임
                </p>
                <h3 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                  도건MVP
                </h3>
              </div>
            </div>

            {/* 하단 정보 플레이트 */}
            <div
              className="
                absolute bottom-0 left-0 right-0
                p-6
                bg-black/55
                backdrop-blur-xl
                border-t border-white/10
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    김도건
                  </h2>
                  <p className="text-stone-300 mt-1.5 text-sm font-medium">
                    KR · 20세 · JUG
                  </p>
                </div>
                <div className="flex flex-col gap-1 rounded-3xl bg-stone-900/80 px-4 py-3 text-right border border-stone-700/80">
                  <span className="text-[0.65rem] uppercase tracking-[0.35em] text-stone-400">
                    매너 별점
                  </span>
                  <span className="text-3xl font-bold text-amber-300">
                    4.8
                  </span>
                  <span className="text-xs text-stone-400">
                    362회 평가
                  </span>
                </div>
              </div>

              <p className="text-stone-300 mt-4 text-sm">
                듀오 구합니다. 함께 편하게 즐길 분 환영해요.
              </p>
            </div>
          </div>

          {/* 오른쪽 LIKE 버튼 */}
          <button
            className="
              w-16 h-16
              rounded-full
              bg-violet-600
              shadow-xl
              flex items-center justify-center
              text-xl
              text-white
              transition-all duration-300
              hover:bg-violet-500
              hover:scale-110
              active:scale-95
              shadow-violet-950/50
            "
          >
            →
          </button>

        </div>
      </main>

    </div>
  );
}