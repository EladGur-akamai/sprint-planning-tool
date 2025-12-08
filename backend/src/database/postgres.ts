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
    // Step 1: Create new tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        default_capacity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create default team first
      INSERT INTO teams (id, name, logo_url) VALUES (1, 'Elad Team', NULL)
        ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS team_members_teams (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        member_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES team_members(id) ON DELETE CASCADE,
        UNIQUE(team_id, member_id)
      );

      -- Create sprints and holidays tables if they don't exist
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

    // Step 2: Add team_id columns to existing tables if they don't exist
    await client.query(`
      -- Add team_id to sprints if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sprints' AND column_name='team_id') THEN
          ALTER TABLE sprints ADD COLUMN team_id INTEGER NOT NULL DEFAULT 1;
          ALTER TABLE sprints ADD CONSTRAINT fk_sprints_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
        END IF;
      END $$;

      -- Add team_id to retro_items if not exists
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='retro_items' AND column_name='team_id') THEN
          ALTER TABLE retro_items ADD COLUMN team_id INTEGER NOT NULL DEFAULT 1;
          ALTER TABLE retro_items ADD CONSTRAINT fk_retro_items_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
        END IF;
      END $$;

      -- Migrate existing team members to default team
      INSERT INTO team_members_teams (team_id, member_id)
      SELECT 1, id FROM team_members
      WHERE id NOT IN (SELECT member_id FROM team_members_teams WHERE team_id = 1)
      ON CONFLICT DO NOTHING;
    `);

    // Step 3: Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_members_teams_team_id ON team_members_teams(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_teams_member_id ON team_members_teams(member_id);
      CREATE INDEX IF NOT EXISTS idx_sprints_team_id ON sprints(team_id);
      CREATE INDEX IF NOT EXISTS idx_retro_items_team_id ON retro_items(team_id);
    `);

    console.log('✅ PostgreSQL tables initialized and migrated');
  } catch (error) {
    console.error('Failed to initialize PostgreSQL tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
