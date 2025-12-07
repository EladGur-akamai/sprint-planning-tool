// Migration script to add load_factor column to existing sprints
import { pool } from '../database/postgres';
import { dbConfig } from '../database/config';

async function migrate() {
  if (dbConfig.type === 'postgres' && pool) {
    console.log('Running PostgreSQL migration: add load_factor to sprints');

    try {
      // Check if column exists
      const columnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='sprints' AND column_name='load_factor';
      `);

      if (columnCheck.rows.length === 0) {
        // Add column if it doesn't exist
        await pool.query(`
          ALTER TABLE sprints
          ADD COLUMN load_factor REAL DEFAULT 0.8;
        `);
        console.log('✅ Added load_factor column');
      } else {
        console.log('ℹ️  load_factor column already exists');
      }

      // Update NULL values to 0.8
      const result = await pool.query(`
        UPDATE sprints
        SET load_factor = 0.8
        WHERE load_factor IS NULL;
      `);
      console.log(`✅ Updated ${result.rowCount} sprints with default load_factor`);

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  } else {
    console.log('Not running PostgreSQL migration (using SQLite)');
  }
}

migrate()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
