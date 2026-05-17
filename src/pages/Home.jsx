import React from 'react';
export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100">

      {/* 컨테이너 */}
      <div className="max-w-md mx-auto px-4 py-6">

        {/* 제목 */}
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-stone-900">
            LOL DUO
          </h1>

          <p className="text-stone-500 mt-2">
            LoL 듀오 매칭 서비스
          </p>
        </div>

        {/* 프로필 */}
        <div className="flex justify-center">

          <div
            className="
              relative
              w-full
              max-w-sm
              aspect-[9/16]
              rounded-3xl
              overflow-hidden
              bg-white/75
              backdrop-blur-xl
              border border-white/30
              shadow-md
              hover:shadow-xl
              transition-all duration-300
            "
          >

            {/* 프로필 이미지 */}
            <img
              src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=1200&auto=format&fit=crop"
              alt="profile"
              className="w-full h-full object-cover"
            />

            {/* 하단 정보 */}
            <div
              className="
                absolute bottom-0 left-0 right-0
                p-5
                bg-black/20
                backdrop-blur-md
              "
            >

              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                김도건
              </h2>

              <p className="text-white/90 mt-1">
                Diamond 2 · 84LP · KR · 20세 · JUG
              </p>

              <p className="text-white/80 text-sm mt-2">
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
                  rounded-2xl
                  bg-white/60
                  backdrop-blur-xl
                  border border-white/30
                "
              >
                <span className="text-yellow-400">
                  ★★★★
                </span>

                <span className="text-stone-700 text-sm">
                  4.0 (24)
                </span>
              </div>

            </div>
          </div>
        </div>

        {/*하단 버튼 */}
        <div className="flex items-center justify-center gap-5 mt-8">

          {/* 넘기기(PASS)버튼 */}
          <button
            className="
              w-14 h-14
              rounded-full
              bg-white/70
              backdrop-blur-xl
              border border-stone-200
              shadow-md
              flex items-center justify-center
              text-stone-500
              transition-all duration-300
              hover:scale-100
              hover:shadow-xl
              active:scale-95
            "
          >
            ←
          </button>

          {/* 좋아요(LIKE)버튼 */}
          <button
            className="
              w-14 h-14
              rounded-full
              bg-violet-500
              text-white
              shadow-md
              flex items-center justify-center
              transition-all duration-300
              hover:bg-violet-600
              hover:scale-100
              hover:shadow-xl
              active:scale-95
            "
          >
            →
          </button>
        </div>
         

      </div>
    </div>

  );
}
