import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchUserById, updateUser } from '../api/users'; // 💡 API 도구 불러오기!

const EditProfile = () => {
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState('');
  const [tag, setTag] = useState('KR1');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('https://i.namu.wiki/i/EZNaF5XmAKKF4LgVE_D0sBSaH1aalphJ5BDr9uGBLqiuxwyzTZygUkCPgTOAhqyn6wBRonLpdkxSQ_EWxfrER-JzvuFbc6m8TjEQXM-ERJzvyTcGPcNlJj3KoxBFHvEfESfntDdLIP_Vu1pWadJUQg.webp');

  const [tier, setTier] = useState('Challenger');
  const [isTierOpen, setIsTierOpen] = useState(false); 
  
  const [gameMode, setGameMode] = useState('랭크');
  const [lane, setLane] = useState('미드');
  const [playStyle, setPlayStyle] = useState('빡겜 유저');

  const tierList = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
  const gameModes = ['일반', '랭크', '칼바람'];
  const lanes = ['탑', '정글', '미드', '바텀', '서폿'];
  const playStyles = ['빡겜 유저', '즐겜 유저', '상대방한테 맞춰요'];
  const fileInputRef = useRef(null);

  // 💡 화면이 켜질 때 백엔드에서 기존 1번 유저의 진짜 데이터를 불러옵니다.
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchUserById(1); // 아직 로그인이 없으므로 임시로 1번 유저 고정
        setNickname(data.nickname || '');
        setTier(data.tier || 'Challenger');
        setLane(data.line || '미드');
        setBio(data.intro || '');
        setPlayStyle(data.duo_style || '빡겜');
        setGameMode(data.game_mode || '랭크');
      } catch (error) {
        console.error("데이터를 불러오지 못했습니다.", error);
      }
    };
    loadData();
  }, []);

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
    if (lower === 'challenger') return 'bg-gradient-to-r from-cyan-500 via-yellow-500 to-amber-500 text-transparent bg-clip-text font-black tracking-tight';
    return 'text-stone-500'; 
  };

  const handleCameraClick = () => fileInputRef.current.click();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(URL.createObjectURL(file));
  };

  // 💡 진짜 백엔드로 데이터를 전송하는 저장 로직!
  const handleSave = async () => {
    if (nickname.trim() === '' || tag.trim() === '') {
      alert("닉네임과 태그를 모두 입력해 주세요!");
      return;
    }

    try {
      const updateData = {
        nickname: nickname,
        tier: tier,
        line: lane,
        intro: bio,
        duo_style: playStyle,
        game_mode: gameMode
      };

      await updateUser(1, updateData);
      
      alert("DB에 프로필이 성공적으로 저장되었습니다! 🎉");
      navigate(-1);
    } catch (error) {
      // 💡 여기서 백엔드의 진짜 에러 이유를 팝업창으로 보여줍니다!
      alert(`저장 실패 이유: ${error.message}`);
    }
  };

  const renderSelectionButtons = (options, state, setState) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => setState(opt)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            state === opt 
              ? 'bg-violet-500 text-white shadow-md scale-105' 
              : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      <header className="flex items-center justify-between px-5 py-6 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-stone-200/50">
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-stone-500 hover:bg-white rounded-full transition-all duration-300"><ArrowLeft size={24} /></button>
          <h1 className="text-xl font-extrabold tracking-tight text-stone-900">프로필 수정</h1>
        </div>
      </header>

      <main className="px-5 space-y-8 mt-6">
        <section className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden shadow-md">
              <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
            </div>
            <button onClick={handleCameraClick} className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg border border-stone-100 text-stone-700 hover:text-violet-500"><Camera size={18} /></button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-stone-800 ml-1">닉네임 및 라이엇 태그</label>
            <div className="flex gap-2">
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-2/3 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-violet-400 outline-none font-medium" />
              <div className="relative w-1/3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">#</span>
                <input type="text" value={tag} onChange={(e) => setTag(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-7 pr-3 py-3.5 focus:ring-2 focus:ring-violet-400 outline-none font-bold uppercase" />
              </div>
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-sm font-extrabold text-stone-800 ml-1">현재 티어</label>
            <div onClick={() => setIsTierOpen(!isTierOpen)} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 flex justify-between items-center cursor-pointer hover:border-violet-300 transition-colors">
              <span className={`font-extrabold text-lg ${getTierColor(tier)}`}>{tier}</span>
              <ChevronDown size={20} className={`text-stone-400 transition-transform duration-300 ${isTierOpen ? 'rotate-180' : ''}`} />
            </div>
            {isTierOpen && (
              <ul className="absolute z-20 w-full mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2">
                {tierList.map(t => (
                  <li key={t} onClick={() => { setTier(t); setIsTierOpen(false); }} className="px-4 py-3.5 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-0">
                    <span className={`font-extrabold text-base ${getTierColor(t)}`}>{t}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1"><label className="text-sm font-extrabold text-stone-800 ml-1">주로 하는 모드</label>{renderSelectionButtons(gameModes, gameMode, setGameMode)}</div>
          <div className="space-y-1"><label className="text-sm font-extrabold text-stone-800 ml-1">주 포지션</label>{renderSelectionButtons(lanes, lane, setLane)}</div>
          <div className="space-y-1"><label className="text-sm font-extrabold text-stone-800 ml-1">게임 스타일</label>{renderSelectionButtons(playStyles, playStyle, setPlayStyle)}</div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-extrabold text-stone-800 ml-1">한줄 소개</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-violet-400 outline-none resize-none font-medium leading-relaxed" />
          </div>
        </section>

        <div className="pt-4 pb-8">
          <button onClick={handleSave} className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-2xl shadow-lg transition-all duration-300 py-4 font-bold text-lg active:scale-[0.98]">변경사항 저장하기</button>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;