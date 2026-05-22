const express = require('express');
const router = express.Router();

const { run, all } = require('../db/database');

// 신고 등록
router.post('/submit', async (req, res) => {
  try {
    const { reporter_id, target_user_id, reason } = req.body;

    const query = `
      INSERT INTO reports (
        reporter_id,
        target_user_id,
        reason,
        created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;

    const result = await run(query, [
      reporter_id,
      target_user_id,
      reason,
    ]);

    res.status(201).json({
      message: '신고가 정상적으로 접수되었습니다.',
      reportId: result.lastID,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '신고 접수 실패',
    });
  }
});

// 신고 목록 조회
router.get('/', async (req, res) => {
  try {
    const rows = await all(`
      SELECT * FROM reports
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '신고 목록 조회 실패',
    });
  }
});

module.exports = router;