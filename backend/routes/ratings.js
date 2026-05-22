const express = require('express');
const router = express.Router();

const { run, all } = require('../db/database');

// 별점 등록
router.post('/', async (req, res) => {
  try {
    const {
      from_user_id,
      to_user_id,
      match_id,
      score
    } = req.body;

    if (score < 0 || score > 5) {
      return res.status(400).json({
        error: '별점은 0~5점 사이여야 합니다.'
      });
    }

    const query = `
      INSERT INTO ratings (
        from_user_id,
        to_user_id,
        match_id,
        score,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
    `;

    const result = await run(query, [
      from_user_id,
      to_user_id,
      match_id,
      score
    ]);

    res.status(201).json({
      message: '별점 등록 완료',
      ratingId: result.lastID
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '별점 등록 실패'
    });
  }
});

// 별점 조회
router.get('/', async (req, res) => {
  try {
    const rows = await all(`
      SELECT * FROM ratings
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '별점 조회 실패'
    });
  }
});

module.exports = router;