/* ============================================================
   SolarVerse – server.js
   Main Express server entry point
   ============================================================ */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */

// Parse JSON bodies
app.use(express.json());

// Enable CORS (allows frontend on different port during dev)
app.use(cors({
  origin: '*',         // In production, restrict to your domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging (simple)
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
});

/* ---------- API Routes ---------- */

// Import route modules
const authRoutes     = require('./routes/auth');
const planetRoutes   = require('./routes/planets');
const quizRoutes     = require('./routes/quiz');
const progressRoutes = require('./routes/progress');

// Mount routes under /api
app.use('/api/auth',     authRoutes);
app.use('/api/planets',  planetRoutes);
app.use('/api/quiz',     quizRoutes);
app.use('/api/progress', progressRoutes);

/* ---------- Serve Frontend Static Files ---------- */

// Serve the frontend from the parent directory (solarverse/)
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// For any non-API route, serve index.html (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

/* ---------- Error Handler ---------- */

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

/* ---------- Start Server ---------- */

app.listen(PORT, () => {
  console.log('');
  console.log('  🪐  ═══════════════════════════════════════');
  console.log('  🪐  SolarVerse Server running!');
  console.log(`  🪐  Local:   http://localhost:${PORT}`);
  console.log(`  🪐  API:     http://localhost:${PORT}/api`);
  console.log('  🪐  ═══════════════════════════════════════');
  console.log('');
  console.log('  API Endpoints:');
  console.log('    POST /api/auth/register    – Create account');
  console.log('    POST /api/auth/login       – Log in');
  console.log('    GET  /api/auth/profile     – User profile (auth)');
  console.log('    GET  /api/planets          – All planets');
  console.log('    GET  /api/planets/:id      – Single planet');
  console.log('    POST /api/planets/:id/feedback – Leave comment (auth)');
  console.log('    POST /api/quiz/submit      – Submit score (auth)');
  console.log('    GET  /api/quiz/leaderboard – Top scores');
  console.log('    GET  /api/quiz/history     – Your history (auth)');
  console.log('    POST /api/progress/visit   – Mark planet visited (auth)');
  console.log('    GET  /api/progress         – Your progress (auth)');
  console.log('');
});
