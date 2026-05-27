import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function MyChats() {
  const navigate = useNavigate();

  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    const activeChats =
        JSON.parse(localStorage.getItem('activeChats')) || [];

    const endedChats =
        JSON.parse(localStorage.getItem('chatHistory')) || [];

        setChatHistory([...activeChats, ...endedChats]);
  }, []);

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      {/* 배경 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      {/* 헤더 */}
      <header className="
        relative z-10
        h-20
        border-b border-white/10
        flex items-center gap-4
        px-8
        backdrop-blur-xl
        bg-black/20
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

        <div>
          <h1 className="text-2xl font-black tracking-tight">
            나의 채팅방
          </h1>

          <p className="text-sm text-stone-400">
            종료된 듀오 채팅 기록
          </p>
        </div>

      </header>

      {/* 메인 */}
      <main className="
        relative z-10
        max-w-4xl mx-auto
        px-6 py-8
        space-y-5
      ">

        {chatHistory.length === 0 && (
          <div className="
            bg-white/5
            border border-white/10
            rounded-[32px]
            p-10
            text-center
          ">
            <MessageCircle
              size={40}
              className="mx-auto text-violet-400 mb-4"
            />

            <h2 className="text-2xl font-black mb-2">
              아직 종료된 채팅이 없습니다
            </h2>

            <p className="text-stone-400">
              매칭 후 채팅을 종료하면 이곳에 저장됩니다.
            </p>
          </div>
        )}

        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className="
              bg-white/5
              backdrop-blur-xl
              border border-white/10
              rounded-[32px]
              p-6
              hover:bg-white/[0.07]
              hover:border-violet-500/30
              transition-all duration-300
            "
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-5">

                <img
                  src={chat.img}
                  alt={chat.name}
                  className="
                    w-20 h-20 rounded-3xl
                    object-cover
                    border border-violet-500/30
                  "
                />

                <div>

                  <h2 className="text-2xl font-black tracking-tight">
                    {chat.name}

                    <span className="ml-2 text-sm text-stone-500">
                      #{chat.tag}
                    </span>
                  </h2>

                  <div className="
                    flex items-center gap-2
                    text-stone-400 text-sm mt-2
                  ">
                    <Clock size={15} />

                    {chat.endedAt}
                  </div>

                  <p className="text-sm text-stone-500 mt-2">
                    메시지 {chat.messages.length}개
                  </p>

                </div>

              </div>

              <button
                onClick={() => {
                  localStorage.setItem(
                    'selectedChat',
                    JSON.stringify(chat)
                  );

                  navigate('/chat');
                }}
                className="
                  px-5 py-3 rounded-2xl
                  bg-violet-600 hover:bg-violet-500
                  font-bold
                  flex items-center gap-2
                  transition-all
                "
              >
                다시 보기
                <ChevronRight size={18} />
              </button>

            </div>

          </div>
        ))}

      </main>

    </div>
  );
}