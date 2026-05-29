// 좋아요 / 매칭 도메인 로직
// 소켓과 REST 라우터 양쪽에서 동일한 동작이 필요하므로 공용 모듈로 분리

const { run, get } = require('../db/database');

async function recordLike(fromUserId, toUserId) {
  const from = Number(fromUserId);
  const to = Number(toUserId);

  if (!from || !to) {
    throw new Error('fromUserId 또는 toUserId 누락');
  }

  if (from === to) {
    throw new Error('자기 자신에게 좋아요를 보낼 수 없습니다.');
  }

  // UNIQUE 제약으로 중복은 자동 무시 — 이미 있으면 새로 만들지 않고 진행
  await run(
    `INSERT OR IGNORE INTO likes (from_user_id, to_user_id, created_at)
     VALUES (?, ?, datetime('now'))`,
    [from, to]
  );

  // 양방향 like 확인
  const reverse = await get(
    `SELECT id FROM likes
     WHERE from_user_id = ? AND to_user_id = ?`,
    [to, from]
  );

  let matchId = null;

  if (reverse) {
    // 이미 매칭으로 기록된 적이 있는지 확인 (어느 방향이든)
    const existingMatch = await get(
      `SELECT id FROM matches
       WHERE (user_id = ? AND matched_user_id = ?)
          OR (user_id = ? AND matched_user_id = ?)`,
      [from, to, to, from]
    );

    if (existingMatch) {
      matchId = existingMatch.id;
    } else {
      const result = await run(
        `INSERT INTO matches (user_id, matched_user_id, matched_at)
         VALUES (?, ?, datetime('now'))`,
        [from, to]
      );
      matchId = result.lastID;
    }
  }

  return {
    matched: Boolean(reverse),
    matchId,
  };
}

async function getUserPublic(userId) {
  const user = await get(
    `SELECT id, nickname, tier, line, sub_line, intro,
            rating, rating_count, profile_image, duo_style, game_mode
     FROM users WHERE id = ?`,
    [userId]
  );
  return user;
}

module.exports = {
  recordLike,
  getUserPublic,
};
