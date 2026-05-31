const express = require('express');
const bcrypt = require('bcryptjs');
const { getIO } = require('../socket');
const { run, get } = require('../db/database');

const router = express.Router();

const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
const PASSWORD_MIN = 4;

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

    const errors = validateCredentials(nickname, password);

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
      `INSERT INTO users (nickname, password_hash, profile_image)
       VALUES (?, ?, ?)`,
      [nickname, password_hash, defaultAvatar]
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