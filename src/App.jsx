import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Home from './pages/Home';
import MyPage from './pages/MyPage';
import EditProfile from './pages/EditProfile';
import MannerScoreDetail from './pages/MannerScoreDetail';
import MatchHistory from './pages/MatchHistory';
import Chat from './pages/Chat';
import MyChats from './pages/MyChats';
import Login from './pages/Login';

import { isLoggedIn } from './auth';
import { ToastProvider } from './components/Toast';
import NotifyProvider from './components/NotifyProvider';
import MobileFrame from './components/MobileFrame';
import { MobileModeProvider } from './context/MobileMode';

function RequireAuth({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <MobileModeProvider>
        <ToastProvider>
          <NotifyProvider>
            <AppRoutes />
          </NotifyProvider>
        </ToastProvider>
      </MobileModeProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <MobileFrame>
                <Home />
              </MobileFrame>
            </RequireAuth>
          }
        />

        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MobileFrame>
                <MyPage />
              </MobileFrame>
            </RequireAuth>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <RequireAuth>
              <EditProfile />
            </RequireAuth>
          }
        />

        <Route
          path="/manner-score"
          element={
            <RequireAuth>
              <MannerScoreDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/match-history"
          element={
            <RequireAuth>
              <MatchHistory />
            </RequireAuth>
          }
        />

        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />

        <Route
          path="/my-chats"
          element={
            <RequireAuth>
              <MyChats />
            </RequireAuth>
          }
        />

    </Routes>
  );
}
