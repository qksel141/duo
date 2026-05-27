import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Gamepad2, Flag, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const [matchedUser, setMatchedUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isEndedChat, setIsEndedChat] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [input, setInput] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'other',
      text: '안녕하세요! 같이 듀오해요 😄'
    }
  ]);

  const restartReplies = [
    '님이랑 하는게 재밌긴해요',
    '좋아요 한 판 더 하죠!',
    '이번엔 제가 더 잘해볼게요 ㅋㅋ',
    '콜 좋아요 바로 갑시다',
    '님 못해서 하기시러요'
  ];

  const getChatUserId = () => {
    return matchedUser?.userId || matchedUser?.id;
  };

  const saveActiveChat = (nextMessages, started = gameStarted) => {
    if (!matchedUser) return;

    const chatUserId = getChatUserId();

    const activeChats =
      JSON.parse(localStorage.getItem('activeChats')) || [];

    const activeChat = {
      id: matchedUser.chatId || Date.now(),
      userId: chatUserId,
      name: matchedUser.name,
      tag: matchedUser.tag || 'KR1',
      img: matchedUser.img,
      createdAt:
        matchedUser.createdAt || new Date().toLocaleString('ko-KR'),
      messages: nextMessages,
      gameStarted: started
    };

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    localStorage.setItem(
      'activeChats',
      JSON.stringify([activeChat, ...updatedActiveChats])
    );

    localStorage.setItem(
      'currentMatch',
      JSON.stringify({
        id: chatUserId,
        userId: chatUserId,
        name: matchedUser.name,
        tag: matchedUser.tag || 'KR1',
        img: matchedUser.img,
        chatId: activeChat.id,
        createdAt: activeChat.createdAt
      })
    );
  };

  useEffect(() => {
    const currentMatch =
      JSON.parse(localStorage.getItem('currentMatch'));

    const selectedChat =
      JSON.parse(localStorage.getItem('selectedChat'));

    const activeChats =
      JSON.parse(localStorage.getItem('activeChats')) || [];

    if (currentMatch) {
      const activeChat = activeChats.find(
        (chat) =>
          Number(chat.userId) === Number(currentMatch.userId || currentMatch.id)
      );

      setMatchedUser(currentMatch);
      setIsEndedChat(false);
      setGameStarted(activeChat?.gameStarted || false);

      if (activeChat?.messages) {
        setMessages(activeChat.messages);
      }

      localStorage.removeItem('selectedChat');
      return;
    }

    if (selectedChat) {
      const selectedUserId = selectedChat.userId || selectedChat.id;

      const activeChat = activeChats.find(
        (chat) => Number(chat.userId) === Number(selectedUserId)
      );

      if (activeChat) {
        setMatchedUser(activeChat);
        setMessages(activeChat.messages || []);
        setGameStarted(activeChat.gameStarted || false);
        setIsEndedChat(false);

        localStorage.setItem(
          'currentMatch',
          JSON.stringify(activeChat)
        );

        localStorage.removeItem('selectedChat');
        return;
      }

      setMatchedUser(selectedChat);
      setMessages(selectedChat.messages || []);
      setIsEndedChat(true);
      setGameStarted(false);
      return;
    }

    navigate('/my-chats', { replace: true });
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  const removeThisChatEverywhere = () => {
    const chatUserId = getChatUserId();

    const activeChats =
      JSON.parse(localStorage.getItem('activeChats')) || [];

    const chatHistory =
      JSON.parse(localStorage.getItem('chatHistory')) || [];

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    const updatedChatHistory = chatHistory.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    localStorage.setItem(
      'activeChats',
      JSON.stringify(updatedActiveChats)
    );

    localStorage.setItem(
      'chatHistory',
      JSON.stringify(updatedChatHistory)
    );

    localStorage.removeItem('currentMatch');
    localStorage.removeItem('selectedChat');
  };

  const handleBack = () => {
    localStorage.removeItem('selectedChat');

    if (!isEndedChat && matchedUser) {
      saveActiveChat(messages, gameStarted);
    }

    if (isEndedChat) {
      navigate('/my-chats', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    if (isEndedChat || isExploding) return;

    const nextMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'me',
        text: input
      }
    ];

    setMessages(nextMessages);
    saveActiveChat(nextMessages, gameStarted);
    setInput('');
  };

  const handleStartGame = () => {
    if (isEndedChat || isExploding) return;
    if (gameStarted) return;

    const nextMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'system',
        text: '게임이 시작되었습니다. 플레이 후 매칭을 종료할 수 있어요.'
      }
    ];

    setGameStarted(true);
    setMessages(nextMessages);
    saveActiveChat(nextMessages, true);
  };

  const handleRestartMatch = () => {
    if (!matchedUser || isExploding) return;

    const randomReply =
      restartReplies[Math.floor(Math.random() * restartReplies.length)];

    const isRejected = randomReply === '님 못해서 하기시러요';

    const restartedMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'me',
        text: '혹시 다시 한 판 하실래요?'
      },
      {
        id: Date.now() + 1,
        sender: 'other',
        text: randomReply
      },
      {
        id: Date.now() + 2,
        sender: 'system',
        text: isRejected
          ? '상대방이 다시 게임하기를 거절했습니다. 채팅방이 삭제됩니다.'
          : '다시 게임 요청이 수락되었습니다. 게임 시작 버튼을 눌러 진행해 보세요.'
      }
    ];

    setMessages(restartedMessages);

    if (isRejected) {
      setTimeout(() => {
        setIsExploding(true);
      }, 700);

      setTimeout(() => {
        removeThisChatEverywhere();
        navigate('/my-chats', { replace: true });
      }, 1900);

      return;
    }

    setIsEndedChat(false);
    setGameStarted(false);

    const existingChatHistory =
      JSON.parse(localStorage.getItem('chatHistory')) || [];

    const chatUserId = getChatUserId();

    const updatedChatHistory = existingChatHistory.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    localStorage.setItem(
      'chatHistory',
      JSON.stringify(updatedChatHistory)
    );

    localStorage.setItem(
      'currentMatch',
      JSON.stringify({
        id: chatUserId,
        userId: chatUserId,
        name: matchedUser.name,
        tag: matchedUser.tag || 'KR1',
        img: matchedUser.img
      })
    );

    localStorage.removeItem('selectedChat');

    setTimeout(() => {
      saveActiveChat(restartedMessages, false);
    }, 0);
  };

  const handleEndMatch = () => {
    if (!matchedUser) return;

    if (!gameStarted) {
      alert('게임 시작 후 매칭을 종료할 수 있습니다.');
      return;
    }

    const existingChatHistory =
      JSON.parse(localStorage.getItem('chatHistory')) || [];

    const activeChats =
      JSON.parse(localStorage.getItem('activeChats')) || [];

    const chatUserId = getChatUserId();

    const endedMessages = [
      ...messages,
      {
        id: Date.now() + 1,
        sender: 'system',
        text: '매칭이 종료되었습니다.'
      }
    ];

    const newChat = {
      id: Date.now(),
      userId: chatUserId,
      name: matchedUser.name,
      tag: matchedUser.tag || 'KR1',
      img: matchedUser.img,
      endedAt: new Date().toLocaleString('ko-KR'),
      messages: endedMessages,
      gameStarted: false
    };

    const updatedActiveChats = activeChats.filter(
      (chat) => Number(chat.userId) !== Number(chatUserId)
    );

    const alreadySaved = existingChatHistory.some(
      (chat) => Number(chat.userId) === Number(chatUserId)
    );

    const nextChatHistory = alreadySaved
      ? existingChatHistory.map((chat) =>
          Number(chat.userId) === Number(chatUserId)
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

    alert('게임은 즐거우셨나요? 상대에게 별점을 남겨주세요!.');

    navigate('/my-chats', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white flex flex-col relative overflow-hidden">

      <style>{`
        @keyframes chat-explode {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
            filter: blur(0px);
          }
          40% {
            transform: scale(1.04) rotate(1deg);
            opacity: 1;
            filter: blur(1px);
          }
          100% {
            transform: scale(0.2) rotate(12deg) translateY(-120px);
            opacity: 0;
            filter: blur(18px);
          }
        }

        @keyframes danger-flash {
          0% { opacity: 0; }
          40% { opacity: 0.6; }
          100% { opacity: 0; }
        }

        .chat-exploding {
          animation: chat-explode 1.2s ease-in forwards;
        }

        .danger-flash {
          animation: danger-flash 1.2s ease-in forwards;
        }
      `}</style>

      {isExploding && (
        <div className="fixed inset-0 z-[90] bg-red-600/30 danger-flash pointer-events-none" />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[45vw] h-[45vh] bg-violet-600/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 blur-[140px] rounded-full" />
      </div>

      <div
        className={
          isExploding
            ? 'chat-exploding flex flex-col flex-1 relative z-10'
            : 'flex flex-col flex-1 relative z-10'
        }
      >

        <header className="
          h-20 border-b border-white/10
          flex items-center justify-between
          px-8
          backdrop-blur-xl
          bg-black/20
        ">

          <div className="flex items-center gap-4">

            <button
              onClick={handleBack}
              disabled={isExploding}
              className="
                p-2 rounded-full
                hover:bg-white/10
                transition-all
                disabled:opacity-30
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
                    {isExploding
                      ? '채팅방 삭제 중...'
                      : isEndedChat
                        ? '종료된 채팅방'
                        : gameStarted
                          ? '게임 진행 중'
                          : '듀오 채팅방'}
                  </p>
                </div>
              </>
            )}

          </div>

        </header>

        <main className="
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
                  : msg.sender === 'system'
                    ? 'justify-center'
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
                    : msg.sender === 'system'
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                      : 'bg-white/10 text-stone-200 border border-white/10'}
                `}
              >
                {msg.text}
              </div>

            </div>
          ))}

          <div ref={bottomRef} />

        </main>

        <footer className="
          border-t border-white/10
          bg-black/30
          backdrop-blur-xl
          px-6 py-4
        ">

          <div className="max-w-4xl mx-auto space-y-3">

            {isEndedChat ? (
              <button
                onClick={handleRestartMatch}
                disabled={isExploding}
                className="
                  w-full py-4 rounded-2xl
                  bg-violet-600 hover:bg-violet-500
                  font-black
                  flex items-center justify-center gap-2
                  transition-all
                  shadow-[0_0_30px_rgba(124,58,237,0.35)]
                  disabled:opacity-40
                "
              >
                <RotateCcw size={18} />
                다시 게임하기
              </button>
            ) : (
              <div className="flex gap-3">

                <button
                  onClick={handleStartGame}
                  disabled={gameStarted || isExploding}
                  className={`
                    flex-1 py-3 rounded-2xl
                    font-bold
                    flex items-center justify-center gap-2
                    transition-all
                    ${gameStarted
                      ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
                  `}
                >
                  <Gamepad2 size={18} />

                  {gameStarted
                    ? '게임 진행 중'
                    : '게임 시작'}
                </button>

                <button
                  onClick={handleEndMatch}
                  disabled={isExploding}
                  className={`
                    flex-1 py-3 rounded-2xl
                    font-bold
                    flex items-center justify-center gap-2
                    transition-all
                    ${gameStarted
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'}
                  `}
                >
                  <Flag size={18} />
                  매칭 종료
                </button>

              </div>
            )}

            {!gameStarted && !isEndedChat && (
              <p className="text-xs text-stone-500 text-center">
                게임 시작 후 매칭 종료가 가능합니다.
              </p>
            )}

            <div className="flex gap-3">

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                disabled={isEndedChat || isExploding}
                placeholder={
                  isEndedChat
                    ? '종료된 채팅방에서는 메시지를 보낼 수 없습니다.'
                    : '메시지를 입력하세요...'
                }
                className={`
                  flex-1 h-14 rounded-2xl
                  bg-white/5
                  border border-white/10
                  px-5
                  outline-none
                  focus:border-violet-500
                  ${isEndedChat || isExploding
                    ? 'text-stone-500 cursor-not-allowed'
                    : 'text-white'}
                `}
              />

              <button
                onClick={handleSend}
                disabled={isEndedChat || isExploding}
                className={`
                  w-14 h-14 rounded-2xl
                  flex items-center justify-center
                  ${isEndedChat || isExploding
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'}
                `}
              >
                <Send size={20} />
              </button>

            </div>

          </div>

        </footer>

      </div>

    </div>
  );
}