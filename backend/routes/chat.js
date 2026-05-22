const express = require('express');
const router = express.Router();
const db = require('../db/database'); 

// 1. 특정 상대와의 채팅 메시지 내역 전부 가져오기 (GET)
// 예: /api/chats?myId=1&partnerId=2
router.get('/', (req, requireRes) => {
    const { myId, partnerId } = req.query;
    
    // 내가 보냈고 상대가 받았거나, 상대가 보냈고 내가 받은 메시지를 모두 가져옵니다.
    const query = `
        SELECT * FROM chats 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `;

    db.all(query, [myId, partnerId, partnerId, myId], (err, rows) => {
        if (err) {
            return requireRes.status(500).json({ error: '채팅 내역을 불러오는데 실패했습니다.' });
        }
        requireRes.json(rows);
    });
});

// 2. 새로운 채팅 메시지 보내기 (POST)
router.post('/send', (req, requireRes) => {
    const { sender_id, receiver_id, message } = req.body;
    const query = `INSERT INTO chats (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, datetime('now'))`;

    db.run(query, [sender_id, receiver_id, message], function(err) {
        if (err) {
            return requireRes.status(500).json({ error: '메시지 전송에 실패했습니다.' });
        }
        requireRes.status(201).json({ message: '메시지 전송 성공', chatId: this.lastID });
    });
});

module.exports = router;