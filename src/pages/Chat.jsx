import React, { useEffect, useState } from 'react';
import { ArrowLeft, Send, Gamepad2, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();

  const [matchedUser, setMatchedUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'other',
      text: '안녕하세요! 같이 듀오해요 😄'
    }
  ]);

  useEffect(() => {
    const selectedChat =
      JSON.parse(localStorage.getItem('selectedChat'));

    if (selectedChat) {
      setMatchedUser(selectedChat);
      setMessages(selectedChat.messages);
      return;
    }

    const saved =
      JSON.parse(localStorage.getItem('currentMatch'));

    if (saved) {
      setMatchedUser(saved);
    }
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'me',
        text: input
      }
    ]);

    setInput('');
  };

  const handleEndMatch = () => {
    if (!matchedUser) return;

    const existingChatHistory =
      JSON.parse(localStorage.getItem('chatHistory')) || [];

    const activeChats =
      JSON.parse(localStorage.getItem('activeChats')) || [];

    const newChat = {
      id: Date.now(),
      userId: matchedUser.userId || matchedUser.id,
      name: matchedUser.name,
      tag: matchedUser.tag || 'KR1',
      img: matchedUser.img,
      endedAt: new Date().toLocaleString('ko-KR'),
      messages
    };

    const updatedActiveChats = activeChats.filter(
      (chat) =>
        Number(chat.userId) !== Number(matchedUser.userId || matchedUser.id)
    );

    const alreadySaved = existingChatHistory.some(
      (chat) =>
        Number(chat.userId) === Number(matchedUser.userId || matchedUser.id)
    );

    const nextChatHistory = alreadySaved
      ? existingChatHistory.map((chat) =>
          Number(chat.userId) === Number(matchedUser.userId || matchedUser.id)
            ? newChat
            : chat
        )
      : [newChat, ...existingChatHistory];

    localStorage.setItem(
      'activeChats',
      JSON.stringify(updatedActiveChats)
    );

    localStorage.setItem(
      'chatHistory',
      JSON.stringify(nextChatHistory)
    );

    localStorage.removeItem('currentMatch');
    localStorage.removeItem('selectedChat');

    alert('채팅방이 저장되었습니다.');

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">

      {/* 배경 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      {/* 헤더 */}
      <header className="
        relative z-10
        h-20 border-b border-white/10
        flex items-center justify-between
        px-8
        backdrop-blur-xl
        bg-black/20
      ">

        <div className="flex items-center gap-4">

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

          {matchedUser && (
            <>
              <img
                src={matchedUser.img}
                alt={matchedUser.name}
                className="
                  w-12 h-12 rounded-full
                  object-cover
                  border border-violet-500/40
                "
              />

              <div>
                <h2 className="text-lg font-black">
                  {matchedUser.name}
                </h2>

                <p className="text-sm text-stone-400">
                  듀오 채팅방
                </p>
              </div>
            </>
          )}

        </div>

      </header>

      {/* 메시지 */}
      <main className="
        relative z-10
        flex-1 overflow-y-auto
        max-w-4xl w-full mx-auto
        px-6 py-8
        space-y-4
      ">

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`
              flex
              ${msg.sender === 'me'
                ? 'justify-end'
                : 'justify-start'}
            `}
          >

            <div
              className={`
                max-w-[70%]
                px-5 py-3 rounded-2xl
                text-sm font-medium
                ${msg.sender === 'me'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/10 text-stone-200 border border-white/10'}
              `}
            >
              {msg.text}
            </div>

          </div>
        ))}

      </main>

      {/* 하단 */}
      <footer className="
        relative z-10
        border-t border-white/10
        bg-black/30
        backdrop-blur-xl
        px-6 py-4
      ">

        <div className="max-w-4xl mx-auto space-y-3">

          <div className="flex gap-3">

            <button
              onClick={() => setGameStarted(true)}
              className="
                flex-1 py-3 rounded-2xl
                bg-emerald-600 hover:bg-emerald-500
                font-bold
                flex items-center justify-center gap-2
              "
            >
              <Gamepad2 size={18} />

              {gameStarted
                ? '게임 진행 중'
                : '게임 시작'}
            </button>

            <button
              onClick={handleEndMatch}
              className="
                flex-1 py-3 rounded-2xl
                bg-red-600 hover:bg-red-500
                font-bold
                flex items-center justify-center gap-2
              "
            >
              <Flag size={18} />
              매칭 종료
            </button>

          </div>

          <div className="flex gap-3">

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="메시지를 입력하세요..."
              className="
                flex-1 h-14 rounded-2xl
                bg-white/5
                border border-white/10
                px-5
                outline-none
                focus:border-violet-500
              "
            />

            <button
              onClick={handleSend}
              className="
                w-14 h-14 rounded-2xl
                bg-violet-600 hover:bg-violet-500
                flex items-center justify-center
              "
            >
              <Send size={20} />
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
}