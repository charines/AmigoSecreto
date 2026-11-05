import mysql, { type Pool } from 'mysql2/promise';
import type { BackendConfig } from './config.js';

let pool: Pool | null = null;

export function getPool(config: BackendConfig): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      database: config.db.name,
      user: config.db.user,
      password: config.db.pass,
      charset: config.db.charset,
    });
  }
  return pool;
}
