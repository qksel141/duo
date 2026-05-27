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

import { fetchUserById } from '../api/users';

const MyPage = () => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchUserById(1);
        setUserData(data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };

    loadData();
  }, []);

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

    if (isConfirm) {
      alert('성공적으로 로그아웃 되었습니다.');
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#05030d] flex items-center justify-center text-stone-400 font-bold">
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

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

        <h1 className="text-3xl font-black tracking-tight">
          MY
        </h1>

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

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">

          {/* 왼쪽 */}
          <div className="space-y-6">

            {/* 프로필 카드 */}
            <section
              onClick={() => setIsProfileModalOpen(true)}
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
                    src="https://i.namu.wiki/i/EZNaF5XmAKKF4LgVE_D0sBSaH1aalphJ5BDr9uGBLqiuxwyzTZygUkCPgTOAhqyn6wBRonLpdkxSQ_EWxfrER-JzvuFbc6m8TjEQXM-ERJzvyTcGPcNlJj3KoxBFHvEfESfntDdLIP_Vu1pWadJUQg.webp"
                    alt="프로필"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">

                  <h2 className="text-4xl font-black tracking-tight text-white">
                    {userData.nickname}
                    <span className="text-xl text-stone-500 font-medium ml-2">
                      #KR1
                    </span>
                  </h2>

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

                  <p className="text-5xl font-black text-white tracking-tight">
                    {userData.rating || 0}
                    <span className="text-xl text-stone-500 font-medium">
                      / 5.0
                    </span>
                  </p>

                  <p className="text-stone-500 mt-2">
                    {userData.rating_count || 0}명 평가
                  </p>

                </div>

                <div className="text-right">

                  <div className="flex text-yellow-400 justify-end mb-3">
                    <Star size={24} fill="currentColor" />
                    <Star size={24} fill="currentColor" />
                    <Star size={24} fill="currentColor" />
                    <Star size={24} fill="currentColor" />
                    <Star size={24} fill="currentColor" opacity={0.5} />
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
                최근 함께 플레이한 유저 2명이 있습니다.
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
          onClick={() => setIsProfileModalOpen(false)}
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
                onClick={() => setIsProfileModalOpen(false)}
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
            onClick={() => alert('채팅 기능은 준비 중입니다!')}
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