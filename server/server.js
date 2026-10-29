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
const parentOutPath      = path.join(__dirname, '..', 'out');
const legacyStaticPath   = path.join(__dirname, '..', 'legacy-static');
const bundledPublicPath  = path.join(__dirname, 'public');

// Serve static assets from available build paths
[bundledPublicPath, parentOutPath, legacyStaticPath, parentFrontendPath].forEach(dirPath => {
  if (fs.existsSync(dirPath)) {
    app.use(express.static(dirPath));
  }
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const candidateFiles = [
      path.join(bundledPublicPath, 'index.html'),
      path.join(parentOutPath, 'index.html'),
      path.join(legacyStaticPath, 'index.html'),
      path.join(parentFrontendPath, 'index.html')
    ];

    for (const file of candidateFiles) {
      if (fs.existsSync(file)) {
        return res.sendFile(file);
      }
    }
    res.status(404).send('SolarVerse: index.html not found');
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
