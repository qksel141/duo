const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 1. 유저 신고 및 비매너 접수 (POST)
router.post('/submit', (req, requireRes) => {
    const { reporter_id, target_user_id, reason } = req.body;

    const query = `
        INSERT INTO reports (reporter_id, target_user_id, reason, created_at) 
        VALUES (?, ?, ?, datetime('now'))
    `;

    db.run(query, [reporter_id, target_user_id, reason], function(err) {
        if (err) {
            return requireRes.status(500).json({ error: '신고 접수에 실패했습니다.' });
        }
        requireRes.status(201).json({ 
            message: '신고가 정상적으로 접수되었습니다.', 
            reportId: this.lastID 
        });
    });
});

module.exports = router;