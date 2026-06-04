const express = require('express');
const router = express.Router();

const { run, all } = require('../db/database');

// 매칭 성공 저장
router.post('/', async (req, res) => {
  try {
    const { user_id, matched_user_id } = req.body;

    const query = `
      INSERT INTO matches (
        user_id,
        matched_user_id,
        matched_at
      ) VALUES (?, ?, datetime('now'))
    `;

    const result = await run(query, [
      user_id,
      matched_user_id,
    ]);

    res.status(201).json({
      message: '매칭 히스토리가 기록되었습니다.',
      matchId: result.lastID,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '매칭 저장 실패',
    });
  }
});

// 특정 유저 매칭 기록 조회
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // ✨ 중복을 제거하고(GROUP BY) 가장 최근 시간(MAX)만 가져오도록 업그레이드!
    const query = `
      SELECT 
        m.id as match_id,
        MAX(m.matched_at) as date, /* 가장 최근 매칭 시간 */
        u.id as id,
        u.nickname as name,
        u.riot_tag as tag,
        u.profile_image as img
      FROM matches m
      JOIN users u ON u.id = CASE 
        WHEN m.user_id = ? THEN m.matched_user_id 
        ELSE m.user_id 
      END
      WHERE m.user_id = ? OR m.matched_user_id = ?
      GROUP BY u.id /* ✨ 핵심: 같은 유저는 한 줄로 묶어버림 */
      ORDER BY MAX(m.matched_at) DESC
    `;

    const rows = await all(query, [userId, userId, userId]);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: '매칭 기록 조회 실패',
    });
  }
});

module.exports = router;