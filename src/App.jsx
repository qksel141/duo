import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import MyPage from './pages/MyPage';
import EditProfile from './pages/EditProfile';
import MannerScoreDetail from './pages/MannerScoreDetail';

export default function App() {
  return (
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