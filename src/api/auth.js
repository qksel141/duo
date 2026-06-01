const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function postJson(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (상태 ${res.status})`);
  }

  return data;
}

export async function signup({ nickname, password, tier, line, game_mode, duo_style }) {
  const data = await postJson('/auth/signup', {
    nickname,
    password,
    tier,
    line,
    game_mode,
    duo_style,
  });
  return data.user;
}

export async function login({ nickname, password }) {
  const data = await postJson('/auth/login', { nickname, password });
  return data.user;
}
