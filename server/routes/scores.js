const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('./auth');

router.post('/', requireAuth, async (req, res) => {
  try {
    const { score, level, lines } = req.body;
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    const result = await pool.query(
      'INSERT INTO scores (user_id, score, level, lines) VALUES ($1, $2, $3, $4) RETURNING id, score, level, lines, created_at',
      [req.session.userId, score, level || 1, lines || 0]
    );

    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > $1',
      [score]
    );

    res.json({
      submission: result.rows[0],
      rank: parseInt(rankResult.rows[0].rank),
    });
  } catch (err) {
    console.error('Score submit error:', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.score, s.level, s.lines, s.created_at, u.username
      FROM scores s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.score DESC
      LIMIT 10
    `);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/personal', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, score, level, lines, created_at
      FROM scores
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.session.userId]);
    res.json({ scores: result.rows });
  } catch (err) {
    console.error('Personal scores error:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.get('/rank', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) + 1 FROM scores WHERE score > (SELECT COALESCE(MAX(score), 0) FROM scores WHERE user_id = $1)) AS rank,
        (SELECT COUNT(*) FROM scores) AS total_players,
        (SELECT COALESCE(MAX(score), 0) FROM scores WHERE user_id = $1) AS best_score
    `, [req.session.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Rank error:', err);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

module.exports = router;
