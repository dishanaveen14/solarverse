/* ============================================================
   SolarVerse – db.js
   SQLite database initialisation (better-sqlite3) with
   Vercel Serverless (/tmp + in-memory) compatibility
   ============================================================ */

const path = require('path');
const fs = require('fs');
const os = require('os');

let db = null;

function createSqliteDb() {
  const Database = require('better-sqlite3');
  // Use /tmp on Vercel or read-only filesystems; use local ./data otherwise
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dataDir = isServerless ? path.join(os.tmpdir(), 'solarverse-data') : path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, 'solarverse.db');
  const sqlite = new Database(dbPath);

  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      email       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password    TEXT    NOT NULL,
      avatar      TEXT    DEFAULT 'default',
      created_at  TEXT    DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS planet_visits (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      planet_name TEXT    NOT NULL,
      visited_at  TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, planet_name)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      planet_name TEXT    NOT NULL,
      comment     TEXT    NOT NULL,
      rating      INTEGER CHECK(rating BETWEEN 1 AND 5),
      created_at  TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_user    ON quiz_scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_diff    ON quiz_scores(difficulty);
    CREATE INDEX IF NOT EXISTS idx_visits_user  ON planet_visits(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_planet ON feedback(planet_name);
  `);

  console.log('✅ SQLite Database initialised at', dbPath);
  return sqlite;
}

/**
 * Pure-JS fallback store with the same synchronous db.prepare(sql).get/all/run API
 * so Vercel Serverless Functions never crash if native better-sqlite3 binary is unavailable.
 */
function createInMemoryDb() {
  const store = {
    users: [],
    quiz_scores: [],
    planet_visits: [],
    feedback: [],
    seq: { users: 1, quiz_scores: 1, planet_visits: 1, feedback: 1 }
  };

  return {
    pragma() {},
    exec() {},
    prepare(sql) {
      const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();
      return {
        get(...params) {
          if (norm.includes('FROM USERS WHERE USERNAME = ? OR EMAIL = ?')) {
            const [u, e] = params;
            return store.users.find(
              row => row.username.toLowerCase() === String(u).toLowerCase() ||
                     row.email.toLowerCase() === String(e).toLowerCase()
            );
          }
          if (norm.includes('FROM USERS WHERE EMAIL = ?')) {
            const [e] = params;
            return store.users.find(row => row.email.toLowerCase() === String(e).toLowerCase());
          }
          if (norm.includes('FROM USERS WHERE ID = ?')) {
            return store.users.find(row => row.id === Number(params[0]));
          }
          if (norm.includes('COUNT(*) AS COUNT FROM QUIZ_SCORES WHERE USER_ID = ?')) {
            const count = store.quiz_scores.filter(r => r.user_id === Number(params[0])).length;
            return { count };
          }
          if (norm.includes('COUNT(*) AS COUNT FROM PLANET_VISITS WHERE USER_ID = ?')) {
            const count = store.planet_visits.filter(r => r.user_id === Number(params[0])).length;
            return { count };
          }
          if (norm.includes('FROM QUIZ_SCORES WHERE USER_ID = ? AND DIFFICULTY = ?')) {
            const rows = store.quiz_scores.filter(
              r => r.user_id === Number(params[0]) && r.difficulty === params[1]
            );
            if (!rows.length) return { attempts: 0, bestScore: 0, bestTime: 0, avgScore: 0 };
            return {
              attempts: rows.length,
              bestScore: Math.max(...rows.map(r => r.score)),
              bestTime: Math.min(...rows.map(r => r.time_seconds)),
              avgScore: Math.round((rows.reduce((s, r) => s + r.score, 0) / rows.length) * 10) / 10
            };
          }
          return undefined;
        },
        all(...params) {
          if (norm.includes('FROM PLANET_VISITS WHERE USER_ID = ?')) {
            return store.planet_visits.filter(r => r.user_id === Number(params[0]));
          }
          if (norm.includes('FROM QUIZ_SCORES Q JOIN USERS U')) {
            let rows = store.quiz_scores.map(q => {
              const u = store.users.find(usr => usr.id === q.user_id);
              return { ...q, username: u ? u.username : 'Explorer' };
            });
            let limit = 10;
            if (norm.includes('WHERE Q.DIFFICULTY = ?')) {
              rows = rows.filter(r => r.difficulty === params[0]);
              limit = Number(params[1]) || 10;
            } else {
              limit = Number(params[0]) || 10;
            }
            return rows
              .sort((a, b) => b.score - a.score || a.time_seconds - b.time_seconds)
              .slice(0, limit);
          }
          if (norm.includes('FROM FEEDBACK F JOIN USERS U')) {
            return store.feedback
              .filter(f => f.planet_name.toLowerCase() === String(params[0]).toLowerCase())
              .map(f => {
                const u = store.users.find(usr => usr.id === f.user_id);
                return { ...f, username: u ? u.username : 'Explorer' };
              });
          }
          return [];
        },
        run(...params) {
          const now = new Date().toISOString();
          if (norm.startsWith('INSERT INTO USERS')) {
            const [username, email, password] = params;
            const id = store.seq.users++;
            store.users.push({ id, username, email, password, avatar: 'default', created_at: now });
            return { lastInsertRowid: id, changes: 1 };
          }
          if (norm.startsWith('INSERT INTO QUIZ_SCORES')) {
            const [user_id, difficulty, score, total, time_seconds] = params;
            const id = store.seq.quiz_scores++;
            store.quiz_scores.push({ id, user_id, difficulty, score, total, time_seconds, created_at: now });
            return { lastInsertRowid: id, changes: 1 };
          }
          if (norm.includes('INTO PLANET_VISITS')) {
            const [user_id, planet_name] = params;
            const exists = store.planet_visits.some(
              r => r.user_id === Number(user_id) && r.planet_name === planet_name
            );
            if (!exists) {
              const id = store.seq.planet_visits++;
              store.planet_visits.push({ id, user_id: Number(user_id), planet_name, visited_at: now });
            }
            return { lastInsertRowid: 0, changes: exists ? 0 : 1 };
          }
          if (norm.startsWith('DELETE FROM PLANET_VISITS')) {
            const uid = Number(params[0]);
            store.planet_visits = store.planet_visits.filter(r => r.user_id !== uid);
            return { changes: 1 };
          }
          if (norm.startsWith('INSERT INTO FEEDBACK')) {
            const [user_id, planet_name, comment, rating] = params;
            const id = store.seq.feedback++;
            store.feedback.push({ id, user_id, planet_name, comment, rating, created_at: now });
            return { lastInsertRowid: id, changes: 1 };
          }
          return { lastInsertRowid: 0, changes: 0 };
        }
      };
    }
  };
}

try {
  db = createSqliteDb();
} catch (err) {
  console.warn('⚠️ SQLite unavailable in this serverless environment, using in-memory DB fallback:', err.message);
  db = createInMemoryDb();
}

module.exports = db;
