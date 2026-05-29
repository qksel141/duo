import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { signup, login } from '../api/auth';
import { setCurrentUser, clearCurrentUser, getCurrentUserId } from '../auth';
import { disconnectSocket } from '../socket';

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSignup = mode === 'signup';

  const handleSwitchMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setError(null);
    setPassword('');
    setPasswordConfirm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname || !password) {
      setError('닉네임과 비밀번호를 입력해 주세요.');
      return;
    }

    if (isSignup) {
      if (password.length < 4) {
        setError('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
      if (password !== passwordConfirm) {
        setError('비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const action = isSignup ? signup : login;
      const user = await action({ nickname: trimmedNickname, password });

      // 다른 계정으로 들어오는 경우엔 이전 캐시 정리 후 진입
      const currentId = getCurrentUserId();
      if (currentId !== Number(user.id)) {
        disconnectSocket();
        clearCurrentUser();
      }

      setCurrentUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05030d] text-white relative overflow-hidden flex items-center justify-center px-6">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[55vw] h-[55vh] bg-violet-600/20 blur-[160px] rounded-full" />
        <div className="absolute bottom-[5%] -left-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/15 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tight">
            FInd DUO
          </h1>
          <p className="mt-3 text-stone-400">
            {isSignup
              ? '새 계정을 만들고 듀오를 찾아보세요'
              : '닉네임과 비밀번호로 로그인하세요'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="
            bg-white/5 backdrop-blur-xl
            border border-white/10
            rounded-3xl p-8
            space-y-5
          "
        >

          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
              maxLength={20}
              placeholder="예: 정글왕"
              className="
                w-full h-12 px-4 rounded-xl
                bg-black/40 border border-white/10
                outline-none focus:border-violet-500
                text-white placeholder:text-stone-600
              "
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="최소 4자 이상"
              className="
                w-full h-12 px-4 rounded-xl
                bg-black/40 border border-white/10
                outline-none focus:border-violet-500
                text-white placeholder:text-stone-600
              "
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-bold text-stone-400 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                placeholder="다시 입력"
                className="
                  w-full h-12 px-4 rounded-xl
                  bg-black/40 border border-white/10
                  outline-none focus:border-violet-500
                  text-white placeholder:text-stone-600
                "
              />
            </div>
          )}

          {error && (
            <div className="
              text-sm text-red-300
              bg-red-500/10 border border-red-500/30
              rounded-xl px-4 py-3
            ">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="
              w-full h-12 rounded-xl
              bg-violet-600 hover:bg-violet-500
              disabled:bg-stone-700 disabled:cursor-not-allowed
              font-black text-white
              transition-all
              shadow-[0_0_30px_rgba(124,58,237,0.35)]
            "
          >
            {submitting
              ? '처리 중...'
              : isSignup
                ? '회원가입'
                : '로그인'}
          </button>

          <div className="text-center text-sm text-stone-500">
            {isSignup ? (
              <>
                이미 계정이 있나요?{' '}
                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="text-violet-300 hover:text-violet-200 font-bold underline-offset-4 hover:underline"
                >
                  로그인
                </button>
              </>
            ) : (
              <>
                계정이 없나요?{' '}
                <button
                  type="button"
                  onClick={handleSwitchMode}
                  className="text-violet-300 hover:text-violet-200 font-bold underline-offset-4 hover:underline"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-stone-600">
          테스트용 시드 계정 비밀번호는{' '}
          <span className="text-stone-400 font-mono">1234</span>
          입니다. (예: 정글왕 / 1234)
        </p>
      </div>
    </div>
  );
}
