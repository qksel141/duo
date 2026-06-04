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
      badge // ✅ 1. 프론트엔드에서 보낸 뱃지 데이터 받기
    } = req.body;

    if (score < 0 || score > 5) {
      return res.status(400).json({
        error: '별점은 0~5점 사이여야 합니다.'
      });
    }

    // ratings 테이블 저장
    const insertQuery = `
      INSERT INTO ratings (
        from_user_id,
        to_user_id,
        match_id,
        score,
        badge, -- ✅ 2. DB에 뱃지 저장할 칸(Column) 이름 추가
        created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now')) 
    `; // ✅ 물음표(?) 하나 추가

    const result = await run(insertQuery, [
      from_user_id,
      to_user_id,
      match_id,
      score,
      badge // ✅ 3. 물음표 자리에 뱃지 데이터 쏙 넣어주기
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

// 전체 별점 조회
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