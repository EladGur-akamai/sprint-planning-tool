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
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      default_capacity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      UNIQUE(team_id, member_id)
    );

    CREATE TABLE IF NOT EXISTS sprint_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      sprint_number INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      duration_weeks INTEGER NOT NULL,
      load_factor REAL DEFAULT 0.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, quarter, sprint_number)
    );

    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL DEFAULT 1,
      template_id INTEGER,
      name TEXT NOT NULL,
      year INTEGER,
      quarter INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current BOOLEAN DEFAULT 0,
      load_factor REAL DEFAULT 0.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (template_id) REFERENCES sprint_templates(id) ON DELETE SET NULL
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

    CREATE TABLE IF NOT EXISTS retro_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sprint_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL CHECK(type IN ('lesson_learned', 'todo', 'what_went_well', 'what_went_wrong')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_team_members_teams_team_id ON team_members_teams(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_teams_member_id ON team_members_teams(member_id);
    CREATE INDEX IF NOT EXISTS idx_sprints_team_id ON sprints(team_id);
    CREATE INDEX IF NOT EXISTS idx_retro_items_team_id ON retro_items(team_id);

    -- Create default team if it doesn't exist
    INSERT OR IGNORE INTO teams (id, name, logo_url) VALUES (1, 'Elad Team', NULL);
  `);
  console.log('✅ SQLite tables initialized');
};

// Only initialize if SQLite is configured
if (isSQLite()) {
  initSQLite();
}

export default db;
