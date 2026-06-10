import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Home,
  MessageCircle,
  User,
  Star,
  X,
  History
} from 'lucide-react';

import { fetchUserById, fetchMatchHistory } from '../api/users';
import { getCurrentUserId, clearCurrentUser } from '../auth';
import { disconnectSocket } from '../socket';
import { useMobileMode } from '../context/MobileMode';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

const MyPage = () => {
  const navigate = useNavigate();
  const myId = getCurrentUserId();
  const { isMobileMode } = useMobileMode();

  const [userData, setUserData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    if (!myId) {
      navigate('/login', { replace: true });
      return;
    }

    // ✨ 1. 기존 로컬 스토리지 뒤지던 코드 삭제!
    // const savedChats = JSON.parse(localStorage.getItem('chatHistory')) || [];
    // setHistoryCount(savedChats.length);

    // ✨ 2. 백엔드에서 갯수를 가져오는 코드로 교체!
    const fetchMatchCount = async () => {
      try {
        const data = await fetchMatchHistory(myId);
        setHistoryCount(data.length);
      } catch (err) {
        console.error('히스토리 갯수 로딩 실패:', err);
      }
    };
    fetchMatchCount();

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchUserById(myId);
        if (!cancelled) setUserData(data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myId, navigate]);

  useEffect(() => {
    const handlePopState = () => {
      if (isProfileModalOpen) {
        setIsProfileModalOpen(false);

        window.history.pushState(
          null,
          '',
          window.location.pathname
        );
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isProfileModalOpen]);

  const openProfileModal = () => {
    window.history.pushState(
      { profileModal: true },
      '',
      window.location.pathname
    );

    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);

    if (window.history.state?.profileModal) {
      window.history.back();
    }
  };

  const getTierColor = (tier) => {
    if (!tier) return 'text-stone-500';

    const lower = tier.toLowerCase();

    if (lower === 'iron') return 'text-stone-500';
    if (lower === 'bronze') return 'text-amber-700';
    if (lower === 'silver') return 'text-slate-400';
    if (lower === 'gold') return 'text-yellow-500';
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

  const handleNotification = () => {
    alert('새로운 알림이 없습니다.');
  };

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleMannerScore = () => {
    navigate('/manner-score');
  };

  const handleMatchHistory = () => {
    navigate('/match-history');
  };

  const handleLogout = () => {
    const isConfirm = window.confirm('정말 로그아웃 하시겠습니까?');
    if (!isConfirm) return;

    disconnectSocket();
    clearCurrentUser();
    navigate('/login', { replace: true });
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-stone-400 font-bold">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className={`${isMobileMode ? 'min-h-full' : 'min-h-screen'} bg-[#05030d] text-white relative overflow-hidden`}>

      {/* 배경 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div
          className="
            absolute top-[5%] -right-[10%]
            w-[45vw] h-[45vh]
            rounded-full
            bg-violet-600/20
            blur-[120px]
          "
        />

        <div
          className="
            absolute bottom-[0%] -left-[10%]
            w-[40vw] h-[40vh]
            rounded-full
            bg-fuchsia-600/10
            blur-[120px]
          "
        />

      </div>

      {/* Header */}
      <header
        className="
          relative z-20
          max-w-6xl mx-auto
          px-6 py-8
          flex items-center justify-between
        "
      >
        {/* ✨ 타이틀과 홈 버튼을 나란히 묶어주는 영역 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="
              p-2 -ml-2 rounded-full
              text-stone-400
              hover:text-white
              hover:bg-white/10
              transition-all duration-300
            "
          >
            <Home size={28} />
          </button>
          
          <h1 className="text-3xl font-black tracking-tight">
            MY
          </h1>
        </div>    

        <button
          onClick={handleNotification}
          className="
            p-3 rounded-full
            text-stone-400
            hover:text-white
            hover:bg-white/5
            transition-all duration-300
          "
        >
          <Bell size={24} />
        </button>

      </header>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-36">

        <div className={`grid grid-cols-1 ${isMobileMode ? '' : 'xl:grid-cols-[1.1fr_0.9fr]'} gap-8`}>

          {/* 왼쪽 */}
          <div className="space-y-6">

            {/* 프로필 카드 */}
            <section
              onClick={openProfileModal}
              className="
                bg-stone-950/40
                backdrop-blur-2xl
                border border-purple-500/10
                rounded-[32px]
                p-8
                shadow-[0_0_40px_rgba(0,0,0,0.4)]
                hover:border-purple-500/20
                hover:shadow-[0_0_60px_rgba(124,58,237,0.15)]
                transition-all duration-300
                cursor-pointer
              "
            >

              <div className="flex items-center gap-6">

                <div
                  className="
                    w-32 h-32 rounded-full overflow-hidden
                    border border-white/10
                    shadow-[0_0_30px_rgba(124,58,237,0.25)]
                    shrink-0
                  "
                >
                  <img
                    src={userData.profile_image || DEFAULT_AVATAR}
                    alt={userData.nickname || '프로필'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">

                  <h2 className="text-4xl font-black tracking-tight text-white">
                    {userData.nickname}
                  </h2>

                  {(userData.riot_name || userData.riot_tag) && (
                    <p className="mt-2 text-lg font-bold text-stone-300">
                      {userData.riot_name || userData.nickname}
                      <span className="text-stone-500 font-medium ml-1">
                        #{userData.riot_tag || 'KR1'}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">

                    <span className={`font-black text-lg ${getTierColor(userData.tier)}`}>
                      {userData.tier || 'Unranked'}
                    </span>

                    <span className="text-stone-700">|</span>

                    <span className="text-stone-400">
                      KR 서버
                    </span>

                  </div>

                  <p
                    className="
                      mt-5
                      text-stone-300
                      leading-relaxed
                      bg-black/30
                      border border-white/5
                      rounded-2xl
                      px-5 py-4
                    "
                  >
                    {userData.intro || '자기소개가 없습니다.'}
                  </p>

                </div>

              </div>

            </section>

            {/* 매너 점수 */}
            <section
              onClick={handleMannerScore}
              className="
                bg-stone-950/40
                backdrop-blur-2xl
                border border-purple-500/10
                rounded-[32px]
                p-7
                shadow-[0_0_30px_rgba(0,0,0,0.35)]
                hover:border-purple-500/20
                transition-all duration-300
                cursor-pointer
              "
            >

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-xl font-black text-white">
                  매너 점수
                </h3>

                <span
                  className="
                    flex items-center gap-1
                    bg-black/30
                    border border-white/5
                    text-stone-400
                    px-3 py-2
                    rounded-full
                    text-xs font-bold
                  "
                >
                  상세보기
                  <ChevronRight size={14} />
                </span>

              </div>

              <div className="flex items-end justify-between">

                <div>
                  {/* 1. 백엔드 점수를 소수점 첫째 자리(예: 4.8)까지 정확하게 보여주기 */}
                  <p className="text-5xl font-black text-white tracking-tight">
                    {Number(userData.rating || 0).toFixed(1)}
                    <span className="text-xl text-stone-500 font-medium">
                      / 5.0
                    </span>
                  </p>

                  {/* 2. 평가 인원수 연동 */}
                  <p className="text-stone-500 mt-2">
                    {userData.rating_count || 0}명 평가
                  </p>

                </div>

                <div className="text-right">

                  {/* 3. 소수점 비율에 맞춰 노란색이 차오르는 상세 별점 게이지 */}
                  <div className="flex gap-1 justify-end mb-3">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const score = Number(userData.rating || 0);
                      // 별에 노란색을 몇 퍼센트 채울지 계산하는 공식
                      const fillPercent = Math.max(0, Math.min(100, (score - star + 1) * 100));
                      
                      return (
                        <div key={star} className="relative">
                          {/* 바탕에 깔리는 회색 빈 별 */}
                          <Star size={24} className="text-stone-700" />
                          
                          {/* 점수 퍼센트만큼 덮어씌워지는 노란색 꽉 찬 별 */}
                          <div
                            className="absolute top-0 left-0 overflow-hidden"
                            style={{ width: `${fillPercent}%` }}
                          >
                            <Star size={24} className="text-yellow-400 fill-yellow-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <span
                    className="
                      text-sm font-bold
                      text-violet-300
                      bg-violet-500/10
                      border border-violet-500/20
                      px-4 py-2
                      rounded-full
                    "
                  >
                    매우 좋아요
                  </span>

                </div>

              </div>

            </section>

          </div>

          {/* 오른쪽 */}
          <div className="space-y-6">

            {/* 최근 히스토리 */}
            <section
              onClick={handleMatchHistory}
              className="
                bg-stone-950/40
                backdrop-blur-2xl
                border border-purple-500/10
                rounded-[32px]
                p-7
                shadow-[0_0_30px_rgba(0,0,0,0.35)]
                hover:border-purple-500/20
                transition-all duration-300
                cursor-pointer
              "
            >

              <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-3">

                  <History size={22} className="text-violet-400" />

                  <h3 className="text-xl font-black text-white">
                    최근 매칭 히스토리
                  </h3>

                </div>

                <span
                  className="
                    flex items-center gap-1
                    bg-black/30
                    border border-white/5
                    text-stone-400
                    px-3 py-2
                    rounded-full
                    text-xs font-bold
                  "
                >
                  평가하기
                  <ChevronRight size={14} />
                </span>

              </div>

              <p className="text-stone-400 leading-relaxed">
                
                최근 함께 플레이한 유저 {historyCount}명이 있습니다.
                <br />
                별점을 남겨주세요!
              </p>

            </section>

            {/* 메뉴 */}
            <div className="space-y-4">

              <MenuButton
                title="프로필 수정"
                onClick={handleEditProfile}
              />

              <MenuButton
                title="나의 채팅방"
                onClick={() => navigate('/my-chats')}
              />

              <MenuButton
                title="로그아웃"
                isLogout
                onClick={handleLogout}
              />

            </div>

          </div>

        </div>

      </main>

      {/* 모달 */}
      {isProfileModalOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/60
            backdrop-blur-sm
            p-4
          "
          onClick={closeProfileModal}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            className="
              w-full max-w-lg
              bg-[#12091f]
              border border-purple-500/10
              rounded-[32px]
              p-8
              shadow-[0_0_60px_rgba(0,0,0,0.6)]
            "
          >

            <div className="flex items-center justify-between mb-8">

              <h3 className="text-2xl font-black text-white">
                상세 프로필
              </h3>

              <button
                onClick={closeProfileModal}
                className="
                  p-3 rounded-full
                  bg-black/30
                  border border-white/5
                  text-stone-400
                  hover:bg-black/50
                "
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-4">

              <InfoBox
                label="롤 닉네임"
                value={`${userData.riot_name || userData.nickname} #${userData.riot_tag || 'KR1'}`}
                valueColor="text-white"
              />

              <InfoBox
                label="주 게임 모드"
                value={userData.game_mode || '-'}
                valueColor="text-violet-400"
              />

              <InfoBox
                label="주 포지션"
                value={userData.line || '-'}
                valueColor="text-white"
              />

              <InfoBox
                label="플레이 스타일"
                value={userData.duo_style || '-'}
                valueColor="text-orange-400"
              />

            </div>

            <button
              onClick={() => {
                setIsProfileModalOpen(false);

                if (window.history.state?.profileModal) {
                  window.history.back();
                }

                navigate('/edit-profile');
              }}
              className="
                w-full mt-8
                bg-violet-600/80
                hover:bg-violet-500
                text-white
                py-4
                rounded-2xl
                font-black
                text-lg
                transition-all duration-300
                shadow-[0_0_30px_rgba(124,58,237,0.35)]
              "
            >
              프로필 수정하러 가기
            </button>

          </div>

        </div>
      )}

      {/* 하단 네비 */}
      <nav
        className="
          fixed bottom-0 left-0 right-0
          bg-black/50
          backdrop-blur-2xl
          border-t border-purple-500/10
          z-40
        "
      >

        <div
          className="
            max-w-6xl mx-auto
            flex justify-center items-center
            gap-24
            py-5
          "
        >

          <button
            onClick={() => navigate('/')}
            className="
              flex flex-col items-center gap-1
              text-stone-500 hover:text-white
              transition-all duration-300
            "
          >
            <Home size={26} />
            <span className="text-xs font-medium">홈</span>
          </button>

          <button
            onClick={() => navigate('/my-chats')}
            className="
              flex flex-col items-center gap-1
              text-stone-500 hover:text-white
              transition-all duration-300
            "
          >
            <MessageCircle size={26} />
            <span className="text-xs font-medium">채팅</span>
          </button>

          <button
            className="
              flex flex-col items-center gap-1
              text-violet-400 scale-110
            "
          >
            <User size={26} />
            <span className="text-xs font-bold">
              마이페이지
            </span>
          </button>

        </div>

      </nav>

    </div>
  );
};

const MenuButton = ({ title, isLogout, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        flex items-center justify-between
        bg-stone-950/40
        backdrop-blur-2xl
        border border-purple-500/10
        rounded-[24px]
        px-6 py-5
        hover:border-purple-500/20
        hover:bg-stone-900/60
        transition-all duration-300
      "
    >

      <span
        className={`text-lg font-bold ${
          isLogout ? 'text-stone-400' : 'text-white'
        }`}
      >
        {title}
      </span>

      <ChevronRight size={22} className="text-stone-500" />

    </button>
  );
};

const InfoBox = ({ label, value, valueColor }) => {
  return (
    <div
      className="
        flex items-center justify-between
        bg-black/30
        border border-white/5
        rounded-2xl
        px-5 py-4
      "
    >

      <span className="text-stone-500 font-medium">
        {label}
      </span>

      <span className={`font-bold ${valueColor}`}>
        {value}
      </span>

    </div>
  );
};

export default MyPage;