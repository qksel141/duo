const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '..');

const EXPECTED_COLUMNS = [
  'id',
  'nickname',
  'password_hash',
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

const LINES = ['탑', '정글', '미드', '원딜', '서포터'];
const DUO_STYLES = ['상대방한테 맞춰요', '빡겜 유저', '즐겜 유저'];

// 스키마가 바뀔 때마다 이 시그니처를 올려서 자동 마이그레이션 트리거
const SCHEMA_SIGNATURE = 'v2-nickname-unique-password';

function resolveDbPath() {
  if (!process.env.DB_PATH) {
    return path.join(__dirname, 'duo.db');
  }

  return path.isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : path.resolve(BACKEND_ROOT, process.env.DB_PATH);
}

const dbPath = resolveDbPath();
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function needsSchemaMigration() {
  const table = await get(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name='users'"
  );

  if (!table) return false;

  const columns = await all('PRAGMA table_info(users)');
  const names = columns.map((col) => col.name);

  const columnsMismatch =
    names.length !== EXPECTED_COLUMNS.length ||
    !EXPECTED_COLUMNS.every((name) => names.includes(name));

  const constraintsMissing =
    typeof table.sql !== 'string' || !table.sql.includes(SCHEMA_SIGNATURE);

  return columnsMismatch || constraintsMissing;
}

async function createUsersTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname VARCHAR UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      tier VARCHAR,
      line TEXT CHECK(line IN ('탑', '정글', '미드', '원딜', '서포터')),
      sub_line TEXT CHECK(
        sub_line IN ('탑', '정글', '미드', '원딜', '서포터')
        AND sub_line <> line
      ),
      intro TEXT,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      profile_image TEXT,
      duo_style TEXT CHECK(
        duo_style IN ('상대방한테 맞춰요', '빡겜 유저', '즐겜 유저')
      ),
      game_mode VARCHAR,
      badge_skill INTEGER DEFAULT 0,  -- ✅ 실력 뱃지 카운트용
      badge_comm INTEGER DEFAULT 0,   -- ✅ 소통 뱃지 카운트용
      badge_mental INTEGER DEFAULT 0  -- ✅ 멘탈 뱃지 카운트용
    )
  `);
}

async function createLikesTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      created_at TEXT,
      UNIQUE(from_user_id, to_user_id)
    )
  `);
}

async function createRatingsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER,
      to_user_id INTEGER,
      match_id INTEGER,
      score REAL,
      badge TEXT, -- ✅ 어떤 뱃지를 남겼는지 텍스트로 저장할 칸
      created_at TEXT
    )
  `);
}

async function createChatsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      message TEXT,
      created_at TEXT,
      read_at TEXT
    )
  `);
}

// 기존 DB에 read_at 컬럼이 없으면 추가 (데이터 보존)
async function ensureChatsHasReadAt() {
  const cols = await all('PRAGMA table_info(chats)');
  if (!cols.some((c) => c.name === 'read_at')) {
    await exec('ALTER TABLE chats ADD COLUMN read_at TEXT');
    console.log('chats 테이블에 read_at 컬럼 추가');
  }
}

async function createReportsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER,
      target_user_id INTEGER,
      reason TEXT,
      created_at TEXT
    )
  `);
}

async function createMatchesTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      matched_user_id INTEGER,
      matched_at TEXT
    )
  `);
}

async function seedTestUsers() {
  const row = await get('SELECT COUNT(*) AS count FROM users');

  if (row.count > 0) return;

  // 테스트용 시드 계정 공통 비밀번호 (로그인할 때 '1234' 입력)
  const SEED_PASSWORD = '1234';
  const seedPasswordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const insertSql = `
    INSERT INTO users (
      nickname,
      password_hash,
      tier,
      line,
      sub_line,
      intro,
      rating,
      rating_count,
      profile_image,
      duo_style,
      game_mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const testUsers = [
    ['정글왕', 'Diamond', '정글', '탑', '초반 갱킹·오브젝트 위주 플레이', 4.8, 42, 'https://api.dicebear.com/7.x/avataaars/svg?seed=jungle1', '빡겜 유저', '솔로랭크'],
    ['미드장인', 'Master', '미드', '정글', '로밍으로 팀 전체 이득 보는 스타일', 4.6, 31, 'https://api.dicebear.com/7.x/avataaars/svg?seed=mid1', '상대방한테 맞춰요', '솔로랭크'],
    ['탑라이너', 'Platinum', '탑', '미드', '스플릿·텔타워프 자주 사용', 4.2, 18, 'https://api.dicebear.com/7.x/avataaars/svg?seed=top1', '즐겜 유저', '일반'],
    ['서폿천사', 'Diamond', '서포터', '미드', '시야·교전 주도, 팀 보호 우선', 4.9, 55, 'https://api.dicebear.com/7.x/avataaars/svg?seed=sup1', '상대방한테 맞춰요', '솔로랭크'],
    ['원딜장인', 'Gold', '원딜', '서포터', '후반 캐리형, 안전한 딜링', 4.0, 12, 'https://api.dicebear.com/7.x/avataaars/svg?seed=adc1', '즐겜 유저', '일반'],
    ['버드유저', 'Emerald', '미드', '원딜', '버드·제어 라인으로 운영', 4.4, 22, 'https://api.dicebear.com/7.x/avataaars/svg?seed=bird1', '상대방한테 맞춰요', '자유랭크'],
    ['정글러2', 'Silver', '정글', '서포터', '정글링·스케일링 위주', 3.8, 8, 'https://api.dicebear.com/7.x/avataaars/svg?seed=jungle2', '즐겜 유저', '일반'],
    ['서폿메인', 'Platinum', '서포터', '원딜', '버프·힐 중심 서폿', 4.3, 19, 'https://api.dicebear.com/7.x/avataaars/svg?seed=sup2', '상대방한테 맞춰요', '자유랭크'],
    ['탑솔러', 'Diamond', '탑', '정글', '탱커·프론트라인 위주', 4.5, 27, 'https://api.dicebear.com/7.x/avataaars/svg?seed=top2', '빡겜 유저', '솔로랭크'],
    ['미드메이지', 'Master', '미드', '탑', '버스트·픽오프 중심', 4.7, 38, 'https://api.dicebear.com/7.x/avataaars/svg?seed=mid2', '빡겜 유저', '솔로랭크'],
  ];

  await run('BEGIN TRANSACTION');

  try {
    for (const user of testUsers) {
      // [nickname, ...rest] → [nickname, password_hash, ...rest]
      const [nickname, ...rest] = user;
      await run(insertSql, [nickname, seedPasswordHash, ...rest]);
    }

    await run('COMMIT');
    console.log(`테스트 유저 10명 추가 완료 (공통 비밀번호: ${SEED_PASSWORD})`);
  } catch (err) {
    await run('ROLLBACK');
    throw err;
  }
}

// 사라진 유저를 참조하는 좋아요/매칭/채팅 잔재 정리 (#2 픽스)
async function cleanupOrphans() {
  const tables = [
    {
      table: 'likes',
      where: `from_user_id NOT IN (SELECT id FROM users)
              OR to_user_id NOT IN (SELECT id FROM users)`,
    },
    {
      table: 'matches',
      where: `user_id NOT IN (SELECT id FROM users)
              OR matched_user_id NOT IN (SELECT id FROM users)`,
    },
    {
      table: 'chats',
      where: `sender_id NOT IN (SELECT id FROM users)
              OR receiver_id NOT IN (SELECT id FROM users)`,
    },
  ];

  for (const { table, where } of tables) {
    const result = await run(`DELETE FROM ${table} WHERE ${where}`);
    if (result.changes > 0) {
      console.log(`${table} 고아 데이터 ${result.changes}건 정리`);
    }
  }
}

async function initDatabase() {
  if (await needsSchemaMigration()) {
    await exec('DROP TABLE IF EXISTS users');
    console.log('users 테이블 스키마 변경 — 테이블 재생성');
  }

  await createUsersTable();
  await createChatsTable();
  await ensureChatsHasReadAt();
  await createReportsTable();
  await createMatchesTable();
  await createRatingsTable();
  await createLikesTable();

  await seedTestUsers();
  await cleanupOrphans();

  console.log('DB 준비 완료');
}

module.exports = {
  db,
  run,
  get,
  all,
  exec,
  initDatabase,
  LINES,
  DUO_STYLES,
};