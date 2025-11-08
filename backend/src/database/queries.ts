import { isSQLite } from './config';
import db, { pool } from './db';

// Helper to execute SELECT queries
export const queryAll = async <T>(sql: string, params: any[] = []): Promise<T[]> => {
  if (isSQLite()) {
    const stmt = db!.prepare(sql);
    return stmt.all(...params) as T[];
  } else {
    // Convert ? placeholders to $1, $2, etc for PostgreSQL
    const pgSql = convertToPostgresPlaceholders(sql);
    const result = await pool!.query(pgSql, params);
    return result.rows as T[];
  }
};

// Helper to execute SELECT query for single row
export const queryOne = async <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  if (isSQLite()) {
    const stmt = db!.prepare(sql);
    return stmt.get(...params) as T | undefined;
  } else {
    const pgSql = convertToPostgresPlaceholders(sql);
    const result = await pool!.query(pgSql, params);
    return result.rows[0] as T | undefined;
  }
};

// Helper to execute INSERT/UPDATE/DELETE
export const queryRun = async (sql: string, params: any[] = []): Promise<{ lastInsertRowid?: number; changes: number }> => {
  if (isSQLite()) {
    const stmt = db!.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastInsertRowid: result.lastInsertRowid as number,
      changes: result.changes,
    };
  } else {
    const pgSql = convertToPostgresPlaceholders(sql);
    const result = await pool!.query(pgSql, params);
    return {
      changes: result.rowCount || 0,
    };
  }
};

// Helper to execute INSERT and return the inserted row
export const queryInsert = async <T>(sql: string, params: any[] = []): Promise<T> => {
  if (isSQLite()) {
    const stmt = db!.prepare(sql);
    const result = stmt.run(...params);
    return { id: result.lastInsertRowid } as T;
  } else {
    // Add RETURNING * for PostgreSQL
    const pgSql = convertToPostgresPlaceholders(sql) + ' RETURNING *';
    const result = await pool!.query(pgSql, params);
    return result.rows[0] as T;
  }
};

// Helper to execute raw SQL (for transactions, etc)
export const queryExec = async (sql: string): Promise<void> => {
  if (isSQLite()) {
    db!.exec(sql);
  } else {
    await pool!.query(sql);
  }
};

// Convert SQLite ? placeholders to PostgreSQL $1, $2, etc
function convertToPostgresPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}
