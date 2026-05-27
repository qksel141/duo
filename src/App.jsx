import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import MyPage from './pages/MyPage';
import EditProfile from './pages/EditProfile';
import MannerScoreDetail from './pages/MannerScoreDetail';
import MatchHistory from './pages/MatchHistory';
import Chat from './pages/Chat';
import MyChats from './pages/MyChats';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/mypage" element={<MyPage />} />

        <Route path="/edit-profile" element={<EditProfile />} />

        <Route path="/manner-score" element={<MannerScoreDetail />} />

        <Route path="/match-history" element={<MatchHistory />} />

        <Route path="/chat" element={<Chat />} />

        <Route path="/my-chats" element={<MyChats />} />

      </Routes>
    </BrowserRouter>
  );
}