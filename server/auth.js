const bcrypt = require('bcrypt');
const { pool } = require('./db');

const SALT_ROUNDS = 10;

async function register(username, password) {
  if (!username || username.length < 2 || username.length > 20) {
    throw { status: 400, message: 'Username must be 2-20 characters' };
  }
  if (!password || password.length < 4) {
    throw { status: 400, message: 'Password must be at least 4 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw { status: 400, message: 'Username can only contain letters, numbers, and underscores' };
  }

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    throw { status: 409, message: 'Username already taken' };
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, hash]
  );

  return result.rows[0];
}

async function login(username, password) {
  if (!username || !password) {
    throw { status: 400, message: 'Username and password required' };
  }

  const result = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw { status: 401, message: 'Invalid username or password' };
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw { status: 401, message: 'Invalid username or password' };
  }

  return { id: user.id, username: user.username };
}

async function getUserById(id) {
  const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

module.exports = { register, login, getUserById };
