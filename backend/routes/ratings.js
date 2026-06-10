console.log('ratings file loaded');

const express = require('express');
const router = express.Router();

const { run, all, get } = require('../db/database');

// 별점 등록
router.post('/', async (req, res) => {
  try {
    const {
      from_user_id,
      to_user_id,
      match_id,
      score,
      badge
    } = req.body;

    if (score < 0 || score > 5) {
      return res.status(400).json({
        error: '별점은 0~5점 사이여야 합니다.'
      });
    }

    // ✨ 핵심: 이미 평가를 남겼는지 확인하는 철벽 방어 로직!
    const existingRating = await get(
      `SELECT id FROM ratings 
       WHERE from_user_id = ? AND to_user_id = ? AND match_id = ?`,
      [from_user_id, to_user_id, match_id]
    );

    if (existingRating) {
      return res.status(400).json({ 
        error: '이미 평가를 완료한 매칭입니다.' 
      });
    }

    // ratings 테이블 저장 (여기부터는 기존과 동일합니다)
    const insertQuery = `
      INSERT INTO ratings (
        from_user_id,
        to_user_id,
        match_id,
        score,
        badge, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now')) 
    `;

    const result = await run(insertQuery, [
      from_user_id,
      to_user_id,
      match_id,
      score,
      badge
    ]);

    // 평균 별점 계산
    const ratingData = await get(`
      SELECT
        ROUND(AVG(score), 1) AS avg_rating,
        COUNT(*) AS rating_count
      FROM ratings
      WHERE to_user_id = ?
    `, [to_user_id]);

    // users 테이블 업데이트
    await run(`
      UPDATE users
      SET
        rating = ?,
        rating_count = ?
      WHERE id = ?
    `, [
      ratingData.avg_rating,
      ratingData.rating_count,
      to_user_id
    ]);

    res.status(201).json({
      message: '별점 등록 완료',
      ratingId: result.lastID,
      new_rating: ratingData.avg_rating,
      rating_count: ratingData.rating_count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: '별점 등록 실패'
    });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 🔥 핵심: 전체(SELECT *)가 아니라 '나(to_user_id)'에게 달린 평가만 가져오도록 필터링!
    const rows = await all(`
      SELECT * FROM ratings 
      WHERE to_user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '별점 조회 실패' });
  }
});

module.exports = router;