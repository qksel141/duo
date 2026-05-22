import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import MyPage from './pages/MyPage';
import EditProfile from './pages/EditProfile';
import MannerScoreDetail from './pages/MannerScoreDetail';

export default function App() {
  return (
    // BrowserRouter: 웹사이트에 라우터 기능을 달아주는 가장 큰 껍데기
    <BrowserRouter>
      <Routes>
        {/* '/'는 기본 화면(마이페이지)를 뜻합니다. */}
        <Route path="/" element={<MyPage />} />
        
        {/* /edit-profile 주소로 가면 프로필 수정 페이지를 보여줌 */}
        <Route path="/edit-profile" element={<EditProfile />} />
        
        {/* /manner-score 주소로 가면 매너점수 상세 페이지를 보여줌 */}
    <BrowserRouter>
      <Routes>
        {/* 메인 페이지 */}
        <Route path="/" element={<Home />} />

        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPage />} />

        {/* 프로필 수정 */}
        <Route path="/edit-profile" element={<EditProfile />} />

        {/* 매너점수 상세 */}
        <Route path="/manner-score" element={<MannerScoreDetail />} />
      </Routes>
    </BrowserRouter>
  );
}