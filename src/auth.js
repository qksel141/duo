// sessionStorage 사용 → 브라우저 탭마다 다른 계정으로 로그인 가능 (테스트/실사용 모두 유리)
const storage = sessionStorage;

const CURRENT_USER_KEY = 'currentUser';

export function getCurrentUser() {
  try {
    const raw = storage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? Number(user.id) : null;
}

export function setCurrentUser(user) {
  if (!user || !user.id) return;
  storage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      id: Number(user.id),
      nickname: user.nickname ?? `유저 #${user.id}`,
      profile_image: user.profile_image ?? null,
    })
  );
}

export function clearCurrentUser() {
  storage.removeItem(CURRENT_USER_KEY);
  storage.removeItem('currentMatch');
  storage.removeItem('selectedChat');
  storage.removeItem('activeChats');
  storage.removeItem('chatHistory');
  storage.removeItem('removedIds');
}

export function isLoggedIn() {
  return getCurrentUserId() != null;
}
