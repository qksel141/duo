// sessionStorage 사용 → 브라우저 탭마다 다른 계정으로 로그인 가능
const storage = sessionStorage;

const CURRENT_USER_KEY = 'currentUser';

// 채팅/매칭 관련 세션 캐시 키 모음 — 로그인/로그아웃 시 일괄 클리어
const SESSION_CACHE_KEYS = [
  'currentMatch',
  'selectedChat',
  'activeChats',
  'chatHistory',
  'removedIds',
  'likesInboxSeenId',
  'pendingRating', // 매칭 종료 직후 별점 모달용
];

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

function clearSessionCaches() {
  SESSION_CACHE_KEYS.forEach((key) => storage.removeItem(key));
}

export function setCurrentUser(user) {
  if (!user || !user.id) return;

  const previousId = getCurrentUserId();

  // 다른 계정으로 갈아탔다면 이전 세션 캐시 잔재 모두 제거 (#2, #3 픽스)
  if (previousId != null && previousId !== Number(user.id)) {
    clearSessionCaches();
  }

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
  clearSessionCaches();
}

export function isLoggedIn() {
  return getCurrentUserId() != null;
}

// 세션 캐시 객체가 현재 로그인 사용자와 무관한 데이터인지 검사
// 다른 사용자의 currentMatch 등이 잔재로 남아있을 때 자동으로 제거
export function getValidatedSessionJson(key) {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const myId = getCurrentUserId();

    // ownerId 또는 myId 필드를 통해 소유자 검증
    if (parsed && parsed.ownerId != null && Number(parsed.ownerId) !== myId) {
      storage.removeItem(key);
      return null;
    }

    // currentMatch / selectedChat의 경우 본인 ID로 들어있으면 안 됨
    if (
      parsed &&
      (parsed.userId != null || parsed.id != null) &&
      Number(parsed.userId ?? parsed.id) === myId
    ) {
      storage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
