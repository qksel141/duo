const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

// dev: .env.development → http://127.0.0.1:3000 (proxy 502 회피)
// prod: 빈 값 → 동일 오리진 또는 리버스 프록시의 /users
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function fetchUsers() {
  const res = await fetch(apiUrl('/users'));

  if (!res.ok) {
    throw new Error(`유저 목록 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

export async function fetchUserById(id) {
  const res = await fetch(apiUrl(`/users/${id}`));

  if (!res.ok) {
    throw new Error(`유저 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

// DB row를 Home 카드 UI가 기대하는 형태로 변환
export function toProfile(user) {
  const lineLabel = [user.line, user.sub_line]
    .filter(Boolean)
    .join(' / ');

  const rankParts = [user.tier, lineLabel, user.game_mode]
    .filter((part) => part && part.length > 0);

  return {
    id: user.id,
    name: user.nickname ?? `유저 #${user.id}`,
    tier: user.tier ?? null,
    line: user.line ?? null,
    rank: rankParts.join(' · '),
    msg: user.intro ?? user.duo_style ?? '',
    img: user.profile_image || DEFAULT_AVATAR,
    rating: typeof user.rating === 'number' ? user.rating : 0,
    ratingCount:
      typeof user.rating_count === 'number' ? user.rating_count : 0,
  };
}

// 유저 프로필 수정 (백엔드의 PUT /users/:id 와 연결)
export async function updateUser(id, data) {
  const res = await fetch(apiUrl(`/users/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), 
  });

  if (!res.ok) {
    // 💡 백엔드가 뱉어낸 진짜 불만(에러 메시지)을 꺼내서 화면으로 던집니다!
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `서버 에러 (상태 코드: ${res.status})`);
  }

  return res.json();
}

// 별점 평가 등록 (백엔드의 POST /ratings 와 연결)
export async function createRating(data) {
  const res = await fetch(apiUrl('/ratings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), 
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `별점 등록 실패 (상태 코드: ${res.status})`);
  }

  return res.json();
}
// 모든 별점 기록 가져오기 (백엔드의 GET /ratings 와 연결)
export async function fetchRatings() {
  const res = await fetch(apiUrl('/ratings'));
  if (!res.ok) {
    throw new Error('별점 조회 실패');
  }
  return res.json();
}

// 두 유저 간 채팅 내역 가져오기 (백엔드 GET /chats?myId=&partnerId= 와 연결)
export async function fetchChatHistory(myId, partnerId) {
  const params = new URLSearchParams({
    myId: String(myId),
    partnerId: String(partnerId),
  });

  const res = await fetch(apiUrl(`/chats?${params.toString()}`));

  if (!res.ok) {
    throw new Error(`채팅 내역 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

// 내 채팅방 목록 (매칭된 상대들 + 마지막 메시지 + 안 읽은 개수)
export async function fetchChatList(userId) {
  const res = await fetch(apiUrl(`/chats/list/${userId}`));

  if (!res.ok) {
    throw new Error(`채팅 목록 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

// 내가 받은 좋아요 목록
export async function fetchReceivedLikes(userId) {
  const res = await fetch(apiUrl(`/likes/received/${userId}`));

  if (!res.ok) {
    throw new Error(`받은 좋아요 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

// 채팅 상대 신고하기
export async function submitReport({ reporter_id, target_user_id, reason }) {
  const res = await fetch(apiUrl('/reports/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reporter_id, target_user_id, reason }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `신고 접수 실패 (status ${res.status})`);
  }

  return res.json();
}