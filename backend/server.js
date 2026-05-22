const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./db/database');

const usersRouter = require('./routes/users');
const chatsRouter = require('./routes/chats');
const reportsRouter = require('./routes/reports');
const matchesRouter = require('./routes/matches');
const ratingsRouter = require('./routes/ratings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', usersRouter);
app.use('/chats', chatsRouter);
app.use('/reports', reportsRouter);
app.use('/matches', matchesRouter);
app.use('/ratings', ratingsRouter);

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('서버 시작 실패:', err);
    process.exit(1);
  }
}

start();