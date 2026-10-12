/* ============================================================
   SolarVerse – routes/auth.js
   User registration, login, and profile
   ============================================================ */

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/* ----------------------------------------------------------
   POST /api/auth/register
   Body: { username, email, password }
   Returns: { message, user: { id, username, email } }
   ---------------------------------------------------------- */
router.post('/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3–30 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Check if username or email already exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ error: 'Username or email already taken.' });
    }

    // Hash password and insert
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hash);

    // Generate JWT
    const token = jwt.sign(
      { id: result.lastInsertRowid, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: { id: result.lastInsertRowid, username, email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

/* ----------------------------------------------------------
   POST /api/auth/login
   Body: { email, password }
   Returns: { message, token, user }
   ---------------------------------------------------------- */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

/* ----------------------------------------------------------
   GET /api/auth/profile
   Headers: Authorization: Bearer <token>
   Returns: { user: { id, username, email, created_at, stats } }
   ---------------------------------------------------------- */
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Aggregate stats
    const quizCount = db.prepare('SELECT COUNT(*) as count FROM quiz_scores WHERE user_id = ?').get(req.user.id).count;
    const bestScores = db.prepare(`
      SELECT difficulty, MAX(score) as best_score, MIN(time_seconds) as best_time
      FROM quiz_scores WHERE user_id = ? GROUP BY difficulty
    `).all(req.user.id);
    const planetsVisited = db.prepare('SELECT COUNT(*) as count FROM planet_visits WHERE user_id = ?').get(req.user.id).count;

    res.json({
      user: {
        ...user,
        stats: {
          quizAttempts: quizCount,
          bestScores,
          planetsVisited
        }
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
