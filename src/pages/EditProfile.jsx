import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  ChevronDown
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { fetchUserById, updateUser } from '../api/users';
import { getCurrentUserId, setCurrentUser } from '../auth';

const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

const EditProfile = () => {
  const navigate = useNavigate();

  const myId = getCurrentUserId();

  const [nickname, setNickname] = useState('');
  const [riotName, setRiotName] = useState('');
  const [riotTag, setRiotTag] = useState('KR1');
  const [bio, setBio] = useState('');

  const [profileImage, setProfileImage] = useState('');

  const [tier, setTier] = useState('Challenger');
  const [isTierOpen, setIsTierOpen] = useState(false);

  const [gameMode, setGameMode] = useState('랭크');
  const [lane, setLane] = useState('미드');
  const [playStyle, setPlayStyle] = useState('빡겜 유저');

  const tierList = [
    'Iron',
    'Bronze',
    'Silver',
    'Gold',
    'Platinum',
    'Emerald',
    'Diamond',
    'Master',
    'Grandmaster',
    'Challenger'
  ];

  const gameModes = ['일반', '랭크', '칼바람'];
  const lanes = ['탑', '정글', '미드', '바텀', '서폿'];

  const playStyles = [
    '빡겜 유저',
    '즐겜 유저',
    '상대방한테 맞춰요'
  ];

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!myId) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchUserById(myId);

        setNickname(data.nickname || '');
        setRiotName(data.riot_name || '');
        setRiotTag(data.riot_tag || 'KR1');
        setTier(data.tier || 'Challenger');
        setLane(data.line || '미드');
        setBio(data.intro || '');
        setPlayStyle(data.duo_style || '빡겜 유저');
        setGameMode(data.game_mode || '랭크');
        setProfileImage(data.profile_image || '');
      } catch (error) {
        console.error('데이터를 불러오지 못했습니다.', error);
      }
    };

    loadData();
  }, [myId, navigate]);

  const getTierColor = (t) => {
    const lower = t.toLowerCase();

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
      return `
        bg-gradient-to-r
        from-cyan-500
        via-yellow-500
        to-amber-500
        text-transparent
        bg-clip-text
        font-black
      `;
    }

    return 'text-stone-500';
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // blob: URL은 다른 사용자/새로고침 시 깨지므로 base64로 저장한다
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!myId) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (nickname.trim() === '') {
      alert('닉네임을 입력해 주세요!');
      return;
    }

    if (!riotName.trim() || !riotTag.trim()) {
      alert('롤 닉네임과 태그를 모두 입력해 주세요!');
      return;
    }

    try {
      const updateData = {
        nickname,
        riot_name: riotName.trim(),
        riot_tag: riotTag.trim().toUpperCase(),
        tier,
        line: lane,
        intro: bio,
        duo_style: playStyle,
        game_mode: gameMode,
        // blob:은 현재 탭에서만 유효 → 저장하지 않음. 비었으면 null
        profile_image: profileImage.startsWith('blob:') ? null : profileImage || null,
      };

      const updatedUser = await updateUser(myId, updateData);

      if (typeof setCurrentUser === 'function') {
        setCurrentUser(updatedUser);
      }

      alert('DB에 프로필이 성공적으로 저장되었습니다! 🎉');

      navigate('/mypage');
    } catch (error) {
      alert(`저장 실패 이유: ${error.message}`);
    }
  };

  const renderSelectionButtons = (
    options,
    state,
    setState
  ) => (
    <div className="flex flex-wrap gap-3 mt-3">

      {options.map((opt) => (

        <button
          key={opt}
          onClick={() => setState(opt)}
          className={`
            px-5 py-3 rounded-2xl
            text-sm font-black
            transition-all duration-300

            ${
              state === opt
                ? `
                  bg-violet-600/80
                  text-white
                  border border-violet-400/20
                  shadow-[0_0_25px_rgba(124,58,237,0.35)]
                  scale-105
                `
                : `
                  bg-stone-950/40
                  border border-purple-500/10
                  text-stone-400
                  hover:bg-stone-900/60
                  hover:text-white
                `
            }
          `}
        >
          {opt}
        </button>

      ))}

    </div>
  );

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden">

      {/* 배경 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div
          className="
            absolute top-[10%] -right-[10%]
            w-[40vw] h-[40vh]
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
          max-w-5xl mx-auto
          px-6 py-8
          flex items-center justify-between
        "
      >

        <div className="flex items-center gap-4">

          <button
            onClick={() => navigate('/mypage')}
            className="
              p-3 rounded-full
              bg-stone-950/40
              border border-purple-500/10
              text-stone-400
              hover:text-white
              hover:bg-stone-900/60
              transition-all duration-300
            "
          >
            <ArrowLeft size={22} />
          </button>

          <div>

            <h1 className="text-3xl font-black tracking-tight">
              프로필 수정
            </h1>

            <p className="text-stone-500 text-sm mt-1">
              나만의 듀오 프로필을 꾸며보세요
            </p>

          </div>

        </div>

      </header>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24">

        <div
          className="
            bg-stone-950/40
            backdrop-blur-2xl
            border border-purple-500/10
            rounded-[36px]
            p-8 md:p-10
            shadow-[0_0_50px_rgba(0,0,0,0.4)]
          "
        >

          {/* 프로필 이미지 */}
          <section className="flex flex-col items-center mb-12">

            <div className="relative">

              <div
                className="
                  w-36 h-36 rounded-full overflow-hidden
                  border border-white/10
                  shadow-[0_0_35px_rgba(124,58,237,0.25)]
                "
              >

                <img
                  src={profileImage || DEFAULT_AVATAR}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />

              </div>

              <button
                onClick={handleCameraClick}
                className="
                  absolute bottom-1 right-1
                  p-3 rounded-full
                  bg-violet-600
                  text-white
                  shadow-[0_0_25px_rgba(124,58,237,0.4)]
                  hover:bg-violet-500
                  transition-all duration-300
                "
              >
                <Camera size={18} />
              </button>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />

            </div>

          </section>

          {/* 입력 영역 */}
          <section className="space-y-8">

            {/* 닉네임 */}
            <div>
              <label className="text-sm font-black text-stone-300">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="예: 정글왕"
                className="
                  mt-3 w-full
                  bg-black/30
                  border border-white/5
                  rounded-2xl
                  px-5 py-4
                  text-white
                  outline-none
                  focus:border-violet-500/40
                  focus:bg-black/50
                  transition-all duration-300
                "
              />
            </div>

            {/* 롤 닉네임 + 태그 */}
            <div>
              <label className="text-sm font-black text-stone-300">
                롤 닉네임 및 태그
              </label>
              <div className="flex gap-3 mt-3">
                <input
                  type="text"
                  value={riotName}
                  onChange={(e) => setRiotName(e.target.value)}
                  maxLength={16}
                  placeholder="예: Hide on bush"
                  className="
                    flex-1
                    bg-black/30
                    border border-white/5
                    rounded-2xl
                    px-5 py-4
                    text-white
                    outline-none
                    focus:border-violet-500/40
                    focus:bg-black/50
                    transition-all duration-300
                  "
                />

                <div className="relative w-32">
                  <span
                    className="
                      absolute left-4 top-1/2
                      -translate-y-1/2
                      text-stone-500 font-black
                    "
                  >
                    #
                  </span>
                  <input
                    type="text"
                    value={riotTag}
                    onChange={(e) => setRiotTag(e.target.value.replace('#', ''))}
                    maxLength={5}
                    placeholder="KR1"
                    className="
                      w-full
                      bg-black/30
                      border border-white/5
                      rounded-2xl
                      pl-8 pr-4 py-4
                      text-white
                      outline-none
                      uppercase
                      font-black
                      focus:border-violet-500/40
                    "
                  />
                </div>
              </div>
            </div>

            {/* 티어 */}
            <div className="relative">

              <label className="text-sm font-black text-stone-300">
                현재 티어
              </label>

              <div
                onClick={() => setIsTierOpen(!isTierOpen)}
                className="
                  mt-3
                  bg-black/30
                  border border-white/5
                  rounded-2xl
                  px-5 py-4
                  flex items-center justify-between
                  cursor-pointer
                  hover:border-violet-500/30
                  transition-all duration-300
                "
              >

                <span className={`text-xl ${getTierColor(tier)}`}>
                  {tier}
                </span>

                <ChevronDown
                  size={22}
                  className={`
                    text-stone-500
                    transition-transform duration-300
                    ${isTierOpen ? 'rotate-180' : ''}
                  `}
                />

              </div>

              {isTierOpen && (

                <ul
                  className="
                    absolute z-30
                    w-full mt-3
                    bg-[#12091f]
                    border border-purple-500/10
                    rounded-2xl
                    overflow-hidden
                    shadow-[0_0_40px_rgba(0,0,0,0.6)]
                  "
                >

                  {tierList.map((t) => (

                    <li
                      key={t}
                      onClick={() => {
                        setTier(t);
                        setIsTierOpen(false);
                      }}
                      className="
                        px-5 py-4
                        border-b border-white/5 last:border-0
                        hover:bg-white/5
                        cursor-pointer
                        transition-all duration-200
                      "
                    >

                      <span className={`font-black ${getTierColor(t)}`}>
                        {t}
                      </span>

                    </li>

                  ))}

                </ul>

              )}

            </div>

            {/* 게임 모드 */}
            <div>

              <label className="text-sm font-black text-stone-300">
                주로 하는 모드
              </label>

              {renderSelectionButtons(
                gameModes,
                gameMode,
                setGameMode
              )}

            </div>

            {/* 포지션 */}
            <div>

              <label className="text-sm font-black text-stone-300">
                주 포지션
              </label>

              {renderSelectionButtons(
                lanes,
                lane,
                setLane
              )}

            </div>

            {/* 스타일 */}
            <div>

              <label className="text-sm font-black text-stone-300">
                게임 스타일
              </label>

              {renderSelectionButtons(
                playStyles,
                playStyle,
                setPlayStyle
              )}

            </div>

            {/* 소개 */}
            <div>

              <label className="text-sm font-black text-stone-300">
                한줄 소개
              </label>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="
                  mt-3
                  w-full
                  bg-black/30
                  border border-white/5
                  rounded-2xl
                  px-5 py-4
                  text-white
                  resize-none
                  outline-none
                  leading-relaxed
                  focus:border-violet-500/40
                  focus:bg-black/50
                  transition-all duration-300
                "
              />

            </div>

          </section>

          {/* 저장 버튼 */}
          <div className="mt-12">

            <button
              onClick={handleSave}
              className="
                w-full
                bg-violet-600/80
                hover:bg-violet-500
                text-white
                py-5
                rounded-2xl
                text-lg font-black
                transition-all duration-300
                shadow-[0_0_35px_rgba(124,58,237,0.35)]
                active:scale-[0.98]
              "
            >
              변경사항 저장하기
            </button>

          </div>

        </div>

      </main>

    </div>
  );
};

export default EditProfile;