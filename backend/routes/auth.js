const express = require('express');
const bcrypt = require('bcryptjs');
const { getIO } = require('../socket');
const { run, get, LINES, DUO_STYLES } = require('../db/database');

const router = express.Router();

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
const PASSWORD_MIN = 4;
const ALLOWED_TIERS = [
  'Iron', 'Bronze', 'Silver', 'Gold', 'Platinum',
  'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger',
];
const ALLOWED_GAME_MODES = ['솔로랭크', '자유랭크', '일반', '칼바람'];

function validateCredentials(nickname, password) {
  const errors = [];

  if (typeof nickname !== 'string' || nickname.trim().length === 0) {
    errors.push('닉네임을 입력해 주세요.');
  } else {
    const len = nickname.trim().length;

    if (len < NICKNAME_MIN || len > NICKNAME_MAX) {
      errors.push(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자여야 합니다.`);
    }
  }

  if (typeof password !== 'string' || password.length < PASSWORD_MIN) {
    errors.push(`비밀번호는 최소 ${PASSWORD_MIN}자 이상이어야 합니다.`);
  }

  return errors;
}

function validateProfile({ tier, line, game_mode, duo_style }) {
  const errors = [];
  if (tier && !ALLOWED_TIERS.includes(tier)) {
    errors.push('지원하지 않는 티어입니다.');
  }
  if (line && !LINES.includes(line)) {
    errors.push('지원하지 않는 포지션입니다.');
  }
  if (game_mode && !ALLOWED_GAME_MODES.includes(game_mode)) {
    errors.push('지원하지 않는 게임 모드입니다.');
  }
  if (duo_style && !DUO_STYLES.includes(duo_style)) {
    errors.push('지원하지 않는 플레이 스타일입니다.');
  }
  return errors;
}

function publicUser(row) {
  if (!row) return null;

  const { password_hash, ...rest } = row;

  return rest;
}

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const nickname = (req.body?.nickname ?? '').trim();
    const password = req.body?.password ?? '';
    const tier = req.body?.tier || null;
    const line = req.body?.line || null;
    const game_mode = req.body?.game_mode || null;
    const duo_style = req.body?.duo_style || null;

    const errors = validateCredentials(nickname, password);
    errors.push(...validateProfile({ tier, line, game_mode, duo_style }));

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(' ')
      });
    }

    const existing = await get(
      'SELECT id FROM users WHERE nickname = ?',
      [nickname]
    );

    if (existing) {
      return res.status(409).json({
        error: '이미 사용 중인 닉네임입니다.'
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const defaultAvatar =
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`;

    const result = await run(
      `INSERT INTO users (
         nickname, password_hash, profile_image,
         tier, line, game_mode, duo_style
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nickname, password_hash, defaultAvatar, tier, line, game_mode, duo_style]
    );

    const user = await get(
      'SELECT * FROM users WHERE id = ?',
      [result.lastID]
    );

    const newUser = publicUser(user);

    const io = getIO();

    if (io) {
      io.emit('user:created', newUser);
    }

    return res.status(201).json({
      user: newUser
    });
  } catch (err) {
    console.error('signup 실패:', err);

    return res.status(500).json({
      error: err.message
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const nickname = (req.body?.nickname ?? '').trim();
    const password = req.body?.password ?? '';

    if (!nickname || !password) {
      return res.status(400).json({
        error: '닉네임과 비밀번호를 입력해 주세요.'
      });
    }

    const user = await get(
      'SELECT * FROM users WHERE nickname = ?',
      [nickname]
    );

    if (!user) {
      return res.status(401).json({
        error: '닉네임 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        error: '닉네임 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    return res.json({
      user: publicUser(user)
    });
  } catch (err) {
    console.error('login 실패:', err);

    return res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;