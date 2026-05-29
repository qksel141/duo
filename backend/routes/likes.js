const express = require('express');

const { all } = require('../db/database');

const router = express.Router();

// 내가 받은 좋아요 목록 (상대 유저 정보 포함)
router.get('/received/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId가 유효하지 않습니다.' });
    }

    const rows = await all(
      `SELECT l.id, l.from_user_id, l.created_at,
              u.nickname, u.profile_image, u.tier, u.line
       FROM likes l
       JOIN users u ON u.id = l.from_user_id
       WHERE l.to_user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('likes/received 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 내가 보낸 좋아요 목록
router.get('/sent/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId가 유효하지 않습니다.' });
    }

    const rows = await all(
      `SELECT l.id, l.to_user_id, l.created_at,
              u.nickname, u.profile_image, u.tier, u.line
       FROM likes l
       JOIN users u ON u.id = l.to_user_id
       WHERE l.from_user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('likes/sent 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

// 내 매칭 목록 (양방향 like 성립된 상대 유저 정보 포함)
router.get('/matches/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId가 유효하지 않습니다.' });
    }

    const rows = await all(
      `SELECT m.id AS match_id,
              m.matched_at,
              u.id, u.nickname, u.profile_image, u.tier, u.line
       FROM matches m
       JOIN users u ON u.id = CASE
         WHEN m.user_id = ? THEN m.matched_user_id
         ELSE m.user_id
       END
       WHERE m.user_id = ? OR m.matched_user_id = ?
       ORDER BY m.matched_at DESC`,
      [userId, userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('likes/matches 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
