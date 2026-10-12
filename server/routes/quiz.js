/* ============================================================
   SolarVerse – routes/quiz.js
   Quiz score submission, leaderboard, and history
   ============================================================ */

const express = require('express');
const db = require('../db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/* ----------------------------------------------------------
   POST /api/quiz/submit
   Body: { difficulty, score, total, timeSeconds }
   Requires authentication
   ---------------------------------------------------------- */
router.post('/submit', authMiddleware, (req, res) => {
  try {
    const { difficulty, score, total, timeSeconds } = req.body;

    // Validation
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be easy, medium, or hard.' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score.' });
    }
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ error: 'Invalid total.' });
    }

    const time = typeof timeSeconds === 'number' ? timeSeconds : 0;

    db.prepare(`
      INSERT INTO quiz_scores (user_id, difficulty, score, total, time_seconds)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, difficulty, score, total, time);

    // Return updated personal stats for this difficulty
    const stats = db.prepare(`
      SELECT
        COUNT(*) as attempts,
        MAX(score) as bestScore,
        MIN(time_seconds) as bestTime,
        ROUND(AVG(score), 1) as avgScore
      FROM quiz_scores
      WHERE user_id = ? AND difficulty = ?
    `).get(req.user.id, difficulty);

    res.status(201).json({
      message: 'Score submitted!',
      personalStats: stats
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/* ----------------------------------------------------------
   GET /api/quiz/leaderboard
   Query params:
     ?difficulty=easy|medium|hard  (default: all)
     ?limit=10                     (default: 10, max: 50)
   Returns top scores
   ---------------------------------------------------------- */
router.get('/leaderboard', (req, res) => {
  try {
    const difficulty = req.query.difficulty;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    let query, params;

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = `
        SELECT
          q.id, u.username, q.difficulty, q.score, q.total,
          q.time_seconds, q.created_at
        FROM quiz_scores q
        JOIN users u ON q.user_id = u.id
        WHERE q.difficulty = ?
        ORDER BY q.score DESC, q.time_seconds ASC
        LIMIT ?
      `;
      params = [difficulty, limit];
    } else {
      query = `
        SELECT
          q.id, u.username, q.difficulty, q.score, q.total,
          q.time_seconds, q.created_at
        FROM quiz_scores q
        JOIN users u ON q.user_id = u.id
        ORDER BY q.score DESC, q.time_seconds ASC
        LIMIT ?
      `;
      params = [limit];
    }

    const leaderboard = db.prepare(query).all(...params);

    // Also get stats per difficulty
    const stats = db.prepare(`
      SELECT
        difficulty,
        COUNT(*) as totalAttempts,
        ROUND(AVG(score), 1) as avgScore,
        MAX(score) as highestScore,
        COUNT(DISTINCT user_id) as uniquePlayers
      FROM quiz_scores
      GROUP BY difficulty
    `).all();

    res.json({ leaderboard, stats });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/* ----------------------------------------------------------
   GET /api/quiz/history
   Returns the logged-in user's quiz history
   ---------------------------------------------------------- */
router.get('/history', authMiddleware, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT id, difficulty, score, total, time_seconds, created_at
      FROM quiz_scores
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user.id);

    const summary = db.prepare(`
      SELECT
        difficulty,
        COUNT(*) as attempts,
        MAX(score) as bestScore,
        MIN(time_seconds) as bestTime,
        ROUND(AVG(score), 1) as avgScore
      FROM quiz_scores
      WHERE user_id = ?
      GROUP BY difficulty
    `).all(req.user.id);

    res.json({ history, summary });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
