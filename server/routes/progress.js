/* ============================================================
   SolarVerse – routes/progress.js
   User exploration progress tracking
   ============================================================ */

const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const VALID_PLANETS = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

/* ----------------------------------------------------------
   POST /api/progress/visit
   Body: { planetName }
   Marks a planet as visited by the current user
   ---------------------------------------------------------- */
router.post('/visit', authMiddleware, (req, res) => {
  try {
    const { planetName } = req.body;

    if (!planetName || !VALID_PLANETS.includes(planetName)) {
      return res.status(400).json({ error: 'Invalid planet name.' });
    }

    // UPSERT — ignore if already visited
    db.prepare(`
      INSERT OR IGNORE INTO planet_visits (user_id, planet_name)
      VALUES (?, ?)
    `).run(req.user.id, planetName);

    // Return updated progress
    const visited = db.prepare('SELECT planet_name, visited_at FROM planet_visits WHERE user_id = ?').all(req.user.id);

    res.json({
      message: `${planetName} marked as visited!`,
      progress: {
        visited: visited.map(v => v.planet_name),
        visitedCount: visited.length,
        totalPlanets: VALID_PLANETS.length,
        percentage: Math.round((visited.length / VALID_PLANETS.length) * 100)
      }
    });
  } catch (err) {
    console.error('Visit error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/* ----------------------------------------------------------
   GET /api/progress
   Returns the logged-in user's exploration progress
   ---------------------------------------------------------- */
router.get('/', authMiddleware, (req, res) => {
  try {
    const visited = db.prepare('SELECT planet_name, visited_at FROM planet_visits WHERE user_id = ? ORDER BY visited_at').all(req.user.id);

    const visitedSet = new Set(visited.map(v => v.planet_name));
    const notVisited = VALID_PLANETS.filter(p => !visitedSet.has(p));

    res.json({
      progress: {
        visited: visited,
        notVisited,
        visitedCount: visited.length,
        totalPlanets: VALID_PLANETS.length,
        percentage: Math.round((visited.length / VALID_PLANETS.length) * 100)
      }
    });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

/* ----------------------------------------------------------
   DELETE /api/progress/reset
   Resets all planet visits for the current user
   ---------------------------------------------------------- */
router.delete('/reset', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM planet_visits WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'Progress reset successfully.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
