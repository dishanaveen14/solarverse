/* ============================================================
   SolarVerse – routes/planets.js
   Planet data API  (serves the same data the frontend uses)
   ============================================================ */

const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/* ---------- Full planet dataset ---------- */
const PLANETS = [
  {
    id: 0, name: 'Sun', type: 'Star',
    color: '#ffaa00', diameter: '1,392,700 km',
    distanceFromSun: '0 km (center)', moons: 0,
    dayLength: '25.4 Earth days', yearLength: '—',
    description: 'The star at the center of our Solar System, a nearly perfect sphere of hot plasma.',
    facts: [
      'The Sun contains 99.86% of the mass in the Solar System.',
      'Light from the Sun takes about 8 minutes to reach Earth.',
      'The Sun\'s surface temperature is about 5,500 °C (9,932 °F).'
    ]
  },
  {
    id: 1, name: 'Mercury', type: 'Terrestrial Planet',
    color: '#a0a0a0', diameter: '4,879 km',
    distanceFromSun: '57.9 million km', moons: 0,
    dayLength: '58.6 Earth days', yearLength: '88 Earth days',
    description: 'The smallest planet and closest to the Sun, with extreme temperature swings.',
    facts: [
      'Mercury has no atmosphere, causing temps from −180 °C to 430 °C.',
      'A day on Mercury is longer than its year.',
      'Mercury has been visited by only two spacecraft.'
    ]
  },
  {
    id: 2, name: 'Venus', type: 'Terrestrial Planet',
    color: '#e8cda0', diameter: '12,104 km',
    distanceFromSun: '108.2 million km', moons: 0,
    dayLength: '243 Earth days', yearLength: '225 Earth days',
    description: 'Earth\'s "twin" in size, but with a runaway greenhouse atmosphere.',
    facts: [
      'Venus rotates backwards (retrograde rotation).',
      'Venus is the hottest planet — surface temps reach 465 °C.',
      'A day on Venus is longer than its year.'
    ]
  },
  {
    id: 3, name: 'Earth', type: 'Terrestrial Planet',
    color: '#2277cc', diameter: '12,756 km',
    distanceFromSun: '149.6 million km', moons: 1,
    dayLength: '24 hours', yearLength: '365.25 days',
    description: 'Our home — the only known planet to harbour life.',
    facts: [
      'Earth is the densest planet in the Solar System.',
      '71% of Earth\'s surface is covered by water.',
      'Earth\'s magnetic field shields us from solar wind.'
    ]
  },
  {
    id: 4, name: 'Mars', type: 'Terrestrial Planet',
    color: '#cc4422', diameter: '6,792 km',
    distanceFromSun: '227.9 million km', moons: 2,
    dayLength: '24.6 hours', yearLength: '687 Earth days',
    description: 'The Red Planet — a prime candidate for future human exploration.',
    facts: [
      'Olympus Mons on Mars is the tallest volcano in the Solar System (21 km).',
      'Mars has two small moons: Phobos and Deimos.',
      'A Martian day (sol) is only 37 minutes longer than an Earth day.'
    ]
  },
  {
    id: 5, name: 'Jupiter', type: 'Gas Giant',
    color: '#d4a46a', diameter: '142,984 km',
    distanceFromSun: '778.6 million km', moons: 95,
    dayLength: '9.9 hours', yearLength: '11.86 Earth years',
    description: 'The largest planet — a massive gas giant with the Great Red Spot.',
    facts: [
      'Jupiter\'s Great Red Spot is a storm larger than Earth.',
      'Jupiter has at least 95 known moons.',
      'Jupiter has the shortest day of all planets.'
    ]
  },
  {
    id: 6, name: 'Saturn', type: 'Gas Giant',
    color: '#e8d088', diameter: '120,536 km',
    distanceFromSun: '1,433.5 million km', moons: 146,
    dayLength: '10.7 hours', yearLength: '29.46 Earth years',
    description: 'Famous for its stunning ring system made of ice and rock particles.',
    facts: [
      'Saturn\'s rings span 282,000 km but are only ~10 m thick.',
      'Saturn would float in water — it\'s less dense than water.',
      'Saturn\'s moon Titan has liquid methane lakes.'
    ]
  },
  {
    id: 7, name: 'Uranus', type: 'Ice Giant',
    color: '#66cccc', diameter: '51,118 km',
    distanceFromSun: '2,872.5 million km', moons: 28,
    dayLength: '17.2 hours', yearLength: '84.01 Earth years',
    description: 'The ice giant that rotates on its side, giving it extreme seasons.',
    facts: [
      'Uranus has an axial tilt of 98° — it rolls around the Sun.',
      'Uranus was discovered with a telescope in 1781.',
      'Uranus has faint rings discovered in 1977.'
    ]
  },
  {
    id: 8, name: 'Neptune', type: 'Ice Giant',
    color: '#3355cc', diameter: '49,528 km',
    distanceFromSun: '4,495.1 million km', moons: 16,
    dayLength: '16.1 hours', yearLength: '164.8 Earth years',
    description: 'The most distant planet — a deep-blue world with the fastest winds.',
    facts: [
      'Neptune\'s winds reach 2,100 km/h — the fastest in the Solar System.',
      'Neptune was first located through mathematical prediction.',
      'Triton, its largest moon, orbits in the opposite direction.'
    ]
  }
];

/* ----------------------------------------------------------
   GET /api/planets
   Query params: ?type=Gas+Giant  (optional filter)
   Returns all planets or filtered subset
   ---------------------------------------------------------- */
router.get('/', optionalAuth, (req, res) => {
  let result = PLANETS;

  // Optional filter by type
  if (req.query.type) {
    result = result.filter(p => p.type.toLowerCase() === req.query.type.toLowerCase());
  }

  // If user is logged in, attach "visited" flag
  if (req.user) {
    const visits = db.prepare('SELECT planet_name FROM planet_visits WHERE user_id = ?').all(req.user.id);
    const visitedSet = new Set(visits.map(v => v.planet_name));
    result = result.map(p => ({ ...p, visited: visitedSet.has(p.name) }));
  }

  res.json({ planets: result, count: result.length });
});

/* ----------------------------------------------------------
   GET /api/planets/:id
   Returns a single planet by its index (0–8)
   ---------------------------------------------------------- */
router.get('/:id', optionalAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 0 || id >= PLANETS.length) {
    return res.status(404).json({ error: 'Planet not found.' });
  }

  const planet = { ...PLANETS[id] };

  // Attach feedback / comments
  const comments = db.prepare(`
    SELECT f.comment, f.rating, f.created_at, u.username
    FROM feedback f JOIN users u ON f.user_id = u.id
    WHERE f.planet_name = ?
    ORDER BY f.created_at DESC LIMIT 20
  `).all(planet.name);

  planet.comments = comments;

  // Visited flag
  if (req.user) {
    const visit = db.prepare('SELECT 1 FROM planet_visits WHERE user_id = ? AND planet_name = ?').get(req.user.id, planet.name);
    planet.visited = !!visit;
  }

  res.json({ planet });
});

/* ----------------------------------------------------------
   POST /api/planets/:id/feedback
   Body: { comment, rating (1-5) }
   Requires authentication
   ---------------------------------------------------------- */
const { authMiddleware } = require('../middleware/auth');

router.post('/:id/feedback', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 0 || id >= PLANETS.length) {
      return res.status(404).json({ error: 'Planet not found.' });
    }

    const { comment, rating } = req.body;
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required.' });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const planetName = PLANETS[id].name;
    db.prepare('INSERT INTO feedback (user_id, planet_name, comment, rating) VALUES (?, ?, ?, ?)')
      .run(req.user.id, planetName, comment.trim(), rating || null);

    res.status(201).json({ message: 'Feedback submitted!' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
