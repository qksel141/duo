const express = require('express');
const { run, get, all, LINES, DUO_STYLES } = require('../db/database');
const { getIO } = require('../socket');

const router = express.Router();

const USER_FIELDS = [
  'nickname',
  'tier',
  'line',
  'sub_line',
  'intro',
  'rating',
  'rating_count',
  'profile_image',
  'duo_style',
  'game_mode',
];

function pickUserFields(body) {
  const data = {};

  for (const field of USER_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      data[field] = body[field];
    }
  }

  return data;
}

function validateUserData(data, existing = {}) {
  const errors = [];

  if ('line' in data && data.line != null && !LINES.includes(data.line)) {
    errors.push(`line은 ${LINES.join(', ')} 중 하나여야 합니다.`);
  }

  if (
    'sub_line' in data &&
    data.sub_line != null &&
    !LINES.includes(data.sub_line)
  ) {
    errors.push(`sub_line은 ${LINES.join(', ')} 중 하나여야 합니다.`);
  }

  const finalLine = 'line' in data ? data.line : existing.line;
  const finalSubLine = 'sub_line' in data ? data.sub_line : existing.sub_line;

  if (
    finalLine != null &&
    finalSubLine != null &&
    finalLine === finalSubLine
  ) {
    errors.push('sub_line은 line과 같을 수 없습니다.');
  }

  if (
    'duo_style' in data &&
    data.duo_style != null &&
    !DUO_STYLES.includes(data.duo_style)
  ) {
    errors.push(
      `duo_style은 ${DUO_STYLES.join(', ')} 중 하나여야 합니다.`
    );
  }

  return errors;
}

async function getUserById(id) {
  return get('SELECT * FROM users WHERE id = ?', [id]);
}

// 전체 유저 조회
router.get('/', async (req, res) => {
  try {
    const users = await all(`
      SELECT * FROM users
      ORDER BY id
    `);

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// 특정 유저 조회
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // ✅ 1. 이 유저가 받은 뱃지 종류별로 갯수 세어오기 (ratings 테이블)
    const badges = await all(`
      SELECT badge, COUNT(*) as count
      FROM ratings
      WHERE to_user_id = ? AND badge IS NOT NULL AND badge != ''
      GROUP BY badge
    `, [req.params.id]);

    // ✅ 2. 프론트엔드로 보낼 기본 뱃지 갯수를 0으로 세팅
    user.badge_skill = 0;
    user.badge_comm = 0;
    user.badge_mental = 0;

    // ✅ 3. DB에서 세어온 진짜 뱃지 갯수표를 프론트엔드 이름표에 맞춰서 끼워 넣기
    badges.forEach(b => {
      if (b.badge === '실력이 뛰어나요') user.badge_skill = b.count;
      if (b.badge === '소통이 잘 돼요') user.badge_comm = b.count;
      if (b.badge === '멘탈이 좋아요') user.badge_mental = b.count;
    });

    // 뱃지 정보까지 꽉꽉 채워진 유저 데이터를 프론트엔드로 발사!
    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// 유저 생성
router.post('/', async (req, res) => {
  try {
    const data = pickUserFields(req.body);
    const columns = Object.keys(data);

    if (columns.length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided'
      });
    }

    const errors = validateUserData(data);

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(' ')
      });
    }

    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => data[col] ?? null);

    const result = await run(
      `INSERT INTO users (${columns.join(', ')})
       VALUES (${placeholders})`,
      values
    );

    const user = await getUserById(result.lastID);

    const io = getIO();

    if (io) {
      io.emit('user:created', user);
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// 유저 수정
router.put('/:id', async (req, res) => {
  try {
    const existing = await getUserById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const data = pickUserFields(req.body);
    const columns = Object.keys(data);

    if (columns.length === 0) {
      return res.status(400).json({
        error: 'No valid fields provided'
      });
    }

    const errors = validateUserData(data, existing);

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(' ')
      });
    }

    const assignments = columns
      .map((col) => `${col} = ?`)
      .join(', ');

    const values = columns.map((col) => data[col] ?? null);

    values.push(req.params.id);

    await run(
      `UPDATE users
       SET ${assignments}
       WHERE id = ?`,
      values
    );

    const updatedUser = await getUserById(req.params.id);

    const io = getIO();

    if (io) {
      io.emit('user:updated', updatedUser);
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// 유저 삭제
router.delete('/:id', async (req, res) => {
  try {
    const existing = await getUserById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await run(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({
      message: 'User deleted',
      id: Number(req.params.id)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;