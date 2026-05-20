import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const navigate = useNavigate();
  
  // 💡 데이터 저장소 (State)
  const [nickname, setNickname] = useState('윤재');
  const [bio, setBio] = useState('즐겁게 듀오하실 분 찾아요! 멘탈 좋습니다 😊');
  
  // 현재 프로필 사진을 기억하는 공간입니다.
  const [profileImage, setProfileImage] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix');

  // 💡 카메라 버튼과 실제 파일 선택창을 연결해주는 마법의 지팡이(Ref)입니다.
  const fileInputRef = useRef(null);

  // 카메라 버튼을 눌렀을 때 실행될 함수
  const handleCameraClick = () => {
    // 숨겨둔 '진짜 파일 선택창'을 대신 클릭해 줍니다.
    fileInputRef.current.click();
  };

  // 사진을 선택했을 때 실행될 함수
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // 선택한 파일 가져오기
    if (file) {
      // 내 컴퓨터에 있는 사진 파일을 임시 인터넷 주소로 만들어서 화면에 띄웁니다.
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  // 저장하기 버튼을 눌렀을 때 실행될 함수
  const handleSave = () => {
    // 닉네임 칸이 비어있으면 튕겨냅니다.
    if (nickname.trim() === '') {
      alert("닉네임을 입력해 주세요!");
      return;
    }
    
    // 저장이 완료되었다는 알림창을 띄우고,
    alert("프로필이 성공적으로 저장되었습니다! 🎉");
    // 뒤로가기(마이페이지)로 이동합니다.
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
              {/* profileImage에 저장된 사진을 보여줍니다 */}
              <img 
                src={profileImage} 
                alt="프로필" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            {/* 💡 카메라 버튼 */}
            <button 
              onClick={handleCameraClick}
              className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-stone-200 text-stone-600 hover:text-violet-500 transition-all duration-300"
            >
              <Camera size={18} />
            </button>

            {/* 💡 화면에는 안 보이지만 실제로 파일을 선택하게 해주는 진짜 입력창입니다. */}
            <input 
              type="file"
              accept="image/*" // 이미지만 선택할 수 있게 제한
              className="hidden" // 화면에서 숨기기
              ref={fileInputRef} // 지팡이 연결
              onChange={handleImageChange} // 파일이 바뀌면 함수 실행
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
        </section>

        {/* 💡 저장하기 버튼 */}
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