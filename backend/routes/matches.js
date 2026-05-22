const express = require('express');
const router = express.Router();

const { run, all } = require('../db/database');

// 매칭 성공 저장
router.post('/success', async (req, res) => {
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

    const query = `
      SELECT *
      FROM matches
      WHERE user_id = ?
         OR matched_user_id = ?
      ORDER BY matched_at DESC
    `;

    const rows = await all(query, [
      userId,
      userId,
    ]);

    res.json(rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '매칭 기록 조회 실패',
    });
  }
});

module.exports = router;