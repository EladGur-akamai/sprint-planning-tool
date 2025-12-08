import { Pool } from 'pg';
import { dbConfig, isPostgres } from './config';

if (isPostgres() && !dbConfig.url) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
}

export const pool = isPostgres() && dbConfig.url ? new Pool({
  connectionString: dbConfig.url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
}) : null;

// Initialize database tables
export const initPostgres = async () => {
  if (!pool) {
    console.log('⚠️  PostgreSQL not configured, skipping initialization');
    return;
  }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        default_capacity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sprints (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_current BOOLEAN DEFAULT FALSE,
        load_factor REAL DEFAULT 0.8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        sprint_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
        UNIQUE(sprint_id, member_id, date)
      );

      CREATE TABLE IF NOT EXISTS retro_items (
        id SERIAL PRIMARY KEY,
        sprint_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('lesson_learned', 'todo', 'what_went_well', 'what_went_wrong')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ PostgreSQL tables initialized');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
