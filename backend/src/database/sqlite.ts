import Database from 'better-sqlite3';
import path from 'path';
import { isSQLite } from './config';

// Only initialize database if SQLite is configured
const db = isSQLite() ? new Database(path.join(__dirname, '../../sprint-planning.db')) : null;

// Enable foreign keys
if (db) {
  db.pragma('foreign_keys = ON');
}

// Create tables
export const initSQLite = () => {
  if (!db) {
    console.log('⚠️  SQLite not configured, skipping initialization');
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      default_capacity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      UNIQUE(sprint_id, member_id, date)
    );
  `);
  console.log('✅ SQLite tables initialized');
};

// Only initialize if SQLite is configured
if (isSQLite()) {
  initSQLite();
}

export default db;
