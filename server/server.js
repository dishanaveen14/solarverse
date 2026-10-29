/* ============================================================
   SolarVerse – server.js
   Main Express server entry point (Localhost + Vercel Serverless)
   ============================================================ */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware ---------- */

app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Allow camera access for Phone AR mode
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self)');
  next();
});

/* ---------- API Routes ---------- */

const authRoutes     = require('./routes/auth');
const planetRoutes   = require('./routes/planets');
const quizRoutes     = require('./routes/quiz');
const progressRoutes = require('./routes/progress');

app.use('/api/auth',     authRoutes);
app.use('/api/planets',  planetRoutes);
app.use('/api/quiz',     quizRoutes);
app.use('/api/progress', progressRoutes);

/* ---------- Serve Frontend Static Files ---------- */

const parentFrontendPath = path.join(__dirname, '..');
const bundledPublicPath  = path.join(__dirname, 'public');

// Serve from parent directory (when running locally or Root Dir = .)
// and from ./public (when Vercel Root Directory is set to "server")
if (fs.existsSync(path.join(parentFrontendPath, 'index.html'))) {
  app.use(express.static(parentFrontendPath));
}
if (fs.existsSync(path.join(bundledPublicPath, 'index.html'))) {
  app.use(express.static(bundledPublicPath));
}

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const parentIndex = path.join(parentFrontendPath, 'index.html');
    const publicIndex = path.join(bundledPublicPath, 'index.html');
    if (fs.existsSync(parentIndex)) {
      return res.sendFile(parentIndex);
    }
    if (fs.existsSync(publicIndex)) {
      return res.sendFile(publicIndex);
    }
    res.status(404).send('index.html not found');
  }
});

/* ---------- Error Handler ---------- */

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

/* ---------- Start Server Locally / Export for Vercel ---------- */

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  🪐  ═══════════════════════════════════════');
    console.log('  🪐  SolarVerse Server running!');
    console.log(`  🪐  Local:   http://localhost:${PORT}`);
    console.log(`  🪐  API:     http://localhost:${PORT}/api`);
    console.log('  🪐  ═══════════════════════════════════════');
    console.log('');
  });
}

module.exports = app;
