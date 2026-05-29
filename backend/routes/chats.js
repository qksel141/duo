const express = require('express');
const router = express.Router();

const { all, get, run } = require('../db/database');

// 내 채팅방 목록 (매칭된 모든 상대 + 마지막 메시지 + 안 읽은 개수)
router.get('/list/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId가 유효하지 않습니다.' });
    }

    const matches = await all(
      `SELECT
         m.id AS match_id,
         m.matched_at,
         CASE WHEN m.user_id = ? THEN m.matched_user_id ELSE m.user_id END AS partner_id,
         u.nickname, u.profile_image, u.tier
       FROM matches m
       JOIN users u ON u.id = (
         CASE WHEN m.user_id = ? THEN m.matched_user_id ELSE m.user_id END
       )
       WHERE m.user_id = ? OR m.matched_user_id = ?
       ORDER BY m.matched_at DESC`,
      [userId, userId, userId, userId]
    );

    const rooms = await Promise.all(
      matches.map(async (m) => {
        const partnerId = m.partner_id;

        const lastMessage = await get(
          `SELECT id, sender_id, receiver_id, message, created_at, read_at
             FROM chats
             WHERE (sender_id = ? AND receiver_id = ?)
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY id DESC LIMIT 1`,
          [userId, partnerId, partnerId, userId]
        );

        const unreadRow = await get(
          `SELECT COUNT(*) AS cnt FROM chats
             WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
          [partnerId, userId]
        );

        return {
          partner: {
            id: partnerId,
            nickname: m.nickname,
            profile_image: m.profile_image,
            tier: m.tier,
          },
          matchedAt: m.matched_at,
          lastMessage: lastMessage || null,
          unreadCount: unreadRow?.cnt ?? 0,
        };
      })
    );

    // 마지막 메시지 시간 또는 매칭 시간 기준 정렬 (최신순)
    rooms.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.matchedAt || '';
      const bTime = b.lastMessage?.created_at || b.matchedAt || '';
      return bTime.localeCompare(aTime);
    });

    res.json(rooms);
  } catch (err) {
    console.error('chats/list 실패:', err);
    res.status(500).json({ error: err.message });
  }
});

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
    const {
      sender_id,
      receiver_id,
      message,
    } = req.body;

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