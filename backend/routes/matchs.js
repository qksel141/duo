const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 1. 매칭 성공 데이터 기록하기 (POST)
router.post('/success', (req, requireRes) => {
    const { user_id, matched_user_id } = req.body;
    const query = `INSERT INTO matches (user_id, matched_user_id, matched_at) VALUES (?, ?, datetime('now'))`;

    db.run(query, [user_id, matched_user_id], function(err) {
        if (err) {
            return requireRes.status(500).json({ error: '매칭 히스토리 저장에 실패했습니다.' });
        }
        requireRes.status(201).json({ 
            message: '매칭 히스토리가 기록되었습니다.', 
            matchId: this.lastID 
        });
    });
});

// 2. 나의 매칭 히스토리 목록 가져오기 (GET)
// 예: /api/matches/1 (유저 ID가 1인 사람의 매칭 기록들을 조회)
router.get('/:userId', (req, requireRes) => {
    const { userId } = req.params;
    const query = `SELECT * FROM matches WHERE user_id = ? OR matched_user_id = ? ORDER BY matched_at DESC`;

    db.all(query, [userId, userId], (err, rows) => {
        if (err) {
            return requireRes.status(500).json({ error: '매칭 목록을 가져오는데 실패했습니다.' });
        }
        requireRes.json(rows);
    });
});

module.exports = router;