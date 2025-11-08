import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  type: (process.env.DATABASE_TYPE || 'sqlite') as 'sqlite' | 'postgres',
  url: process.env.DATABASE_URL,
  port: parseInt(process.env.PORT || '3001'),
};

export const isSQLite = () => dbConfig.type === 'sqlite';
export const isPostgres = () => dbConfig.type === 'postgres';
