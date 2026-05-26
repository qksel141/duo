const DEFAULT_AVATAR =
  'https://api.dicebear.com/7.x/avataaars/svg?seed=duo-default';

export async function fetchUsers() {
  const res = await fetch('/users');

  if (!res.ok) {
    throw new Error(`유저 목록 조회 실패 (status ${res.status})`);
  }

  return res.json();
}

export async function fetchUserById(id) {
  const res = await fetch(`/users/${id}`);

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
    rank: rankParts.join(' · '),
    msg: user.intro ?? user.duo_style ?? '',
    img: user.profile_image || DEFAULT_AVATAR,
    rating: typeof user.rating === 'number' ? user.rating : 0,
    ratingCount:
      typeof user.rating_count === 'number' ? user.rating_count : 0,
  };
}
