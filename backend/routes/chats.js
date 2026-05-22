const express = require('express');
const router = express.Router();

const { all, run } = require('../db/database');

// 채팅 조회
router.get('/', async (req, res) => {
  try {
    const { myId, partnerId } = req.query;

    const query = `
      SELECT * FROM chats
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;

    const rows = await all(query, [
      myId,
      partnerId,
      partnerId,
      myId,
    ]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: '채팅 내역 조회 실패',
    });
  }
});

// 채팅 전송
router.post('/send', async (req, res) => {
  try {
    const { sender_id, receiver_id, message } = req.body;

    const query = `
      INSERT INTO chats (
        sender_id,
        receiver_id,
        message,
        created_at
      ) VALUES (?, ?, ?, datetime('now'))
    `;

    const result = await run(query, [
      sender_id,
      receiver_id,
      message,
    ]);

    res.status(201).json({
      message: '메시지 전송 성공',
      chatId: result.lastID,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: '메시지 전송 실패',
    });
  }
});

module.exports = router;