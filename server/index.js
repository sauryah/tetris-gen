const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { pool, initDB } = require('./db');
const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions' }),
  secret: process.env.SESSION_SECRET || 'tetris-gen-secret-change-in-prod',
  name: 'tetris.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
  },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts, try again later' },
});

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
