import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Pool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrateSessions(pool: Pool): Promise<void> {
  const sql = readFileSync(join(__dirname, 'sessions.sql'), 'utf8');
  await pool.query(sql);
  console.log('Tabela sessions garantida com sucesso.');
}
