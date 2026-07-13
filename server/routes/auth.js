const express = require('express');
const router = express.Router();
const auth = require('../auth');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await auth.register(username, password);
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await auth.login(username, password);
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('tetris.sid');
    res.json({ ok: true });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }
  try {
    const user = await auth.getUserById(req.session.userId);
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
