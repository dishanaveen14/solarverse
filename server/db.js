/* ============================================================
   SolarVerse – db.js
   SQLite database initialisation (better-sqlite3)
   ============================================================ */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'solarverse.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent-read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ---------- Create Tables ---------- */

db.exec(`
  -- Users table: stores registered accounts
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password    TEXT    NOT NULL,
    avatar      TEXT    DEFAULT 'default',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  -- Quiz scores: one row per quiz attempt
  CREATE TABLE IF NOT EXISTS quiz_scores (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    difficulty    TEXT    NOT NULL CHECK(difficulty IN ('easy','medium','hard')),
    score         INTEGER NOT NULL,
    total         INTEGER NOT NULL DEFAULT 10,
    time_seconds  INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Planet visits: tracks which planets a user has explored
  CREATE TABLE IF NOT EXISTS planet_visits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    planet_name TEXT    NOT NULL,
    visited_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, planet_name)
  );

  -- Feedback: optional comments users leave on planets
  CREATE TABLE IF NOT EXISTS feedback (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    planet_name TEXT    NOT NULL,
    comment     TEXT    NOT NULL,
    rating      INTEGER CHECK(rating BETWEEN 1 AND 5),
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_quiz_user    ON quiz_scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_diff    ON quiz_scores(difficulty);
  CREATE INDEX IF NOT EXISTS idx_visits_user  ON planet_visits(user_id);
  CREATE INDEX IF NOT EXISTS idx_feedback_planet ON feedback(planet_name);
`);

console.log('✅ Database initialised at', dbPath);

module.exports = db;
