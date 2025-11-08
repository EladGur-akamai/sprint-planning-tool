import { isSQLite } from './config';
import sqliteDb from './sqlite';
import postgresPool, { initPostgres } from './postgres';

// Initialize database based on type
export const initDatabase = async () => {
  if (isSQLite()) {
    console.log('📦 Using SQLite database');
    // Already initialized in sqlite.ts
  } else {
    console.log('🐘 Using PostgreSQL database');
    await initPostgres();
  }
};

// Export the appropriate database client
const db = isSQLite() ? sqliteDb : null;
const pool = isSQLite() ? null : postgresPool;

export { pool };
export default db;
