import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LINES = ['탑', '정글', '미드', '원딜', '서포터'];
const DUO_STYLES = ['상대방한테 맞춰요', '빡겜 유저', '즐겜 유저'];

const EditProfile = () => {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('윤재');
  const [bio, setBio] = useState('즐겁게 듀오하실 분 찾아요! 멘탈 좋습니다 😊');
  const [profileImage, setProfileImage] = useState(
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  );

  const [line, setLine] = useState('정글');
  const [subLine, setSubLine] = useState('미드');
  const [duoStyle, setDuoStyle] = useState('상대방한테 맞춰요');

  const fileInputRef = useRef(null);

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleLineChange = (e) => {
    const next = e.target.value;
    setLine(next);
    if (subLine === next) {
      setSubLine('');
    }
  };

  const subLineOptions = LINES.filter((item) => item !== line);

  const handleSave = () => {
    if (nickname.trim() === '') {
      alert('닉네임을 입력해 주세요!');
      return;
    }

    if (!line) {
      alert('주 라인을 선택해 주세요!');
      return;
    }

    if (!subLine) {
      alert('부 라인을 선택해 주세요!');
      return;
    }

    if (line === subLine) {
      alert('주 라인과 부 라인은 같을 수 없습니다!');
      return;
    }

    if (!DUO_STYLES.includes(duoStyle)) {
      alert('듀오 스타일을 선택해 주세요!');
      return;
    }

    alert('프로필이 성공적으로 저장되었습니다! 🎉');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 max-w-md mx-auto relative pb-24">
      <header className="flex items-center px-5 py-6 space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-stone-500 hover:bg-white/50 rounded-full transition-all duration-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
          프로필 수정
        </h1>
      </header>

      <main className="px-4 space-y-6">
        <section className="flex flex-col items-center mt-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden shadow-inner">
              <img
                src={profileImage}
                alt="프로필"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={handleCameraClick}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-stone-200 text-stone-600 hover:text-violet-500 transition-all duration-300"
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

        <section className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-400 outline-none transition-all duration-300 text-stone-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">한줄소개</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-400 outline-none transition-all duration-300 text-stone-900 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">주 라인</label>
            <select
              value={line}
              onChange={handleLineChange}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-400 outline-none transition-all duration-300 text-stone-900"
            >
              {LINES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">부 라인</label>
            <select
              value={subLine}
              onChange={(e) => setSubLine(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-400 outline-none transition-all duration-300 text-stone-900"
            >
              <option value="">선택해 주세요</option>
              {subLineOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500 ml-1">
              주 라인과 동일한 라인은 선택할 수 없습니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">듀오 스타일</label>
            <select
              value={duoStyle}
              onChange={(e) => setDuoStyle(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-violet-400 outline-none transition-all duration-300 text-stone-900"
            >
              {DUO_STYLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <button
          onClick={handleSave}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-2xl shadow-md transition-all duration-300 py-4 font-bold text-lg mt-8 active:scale-[0.98]"
        >
          저장하기
        </button>
      </main>
    </div>
  );
};

export default EditProfile;
