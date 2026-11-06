import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Pool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function migrateParticipantAccounts(pool: Pool): Promise<void> {
  const accountsSql = readFileSync(join(__dirname, 'participant_accounts.sql'), 'utf8');
  await pool.query(accountsSql);
  console.log('Tabela participant_accounts garantida com sucesso.');

  const sessionsSql = readFileSync(join(__dirname, 'participant_sessions.sql'), 'utf8');
  await pool.query(sessionsSql);
  console.log('Tabela participant_sessions garantida com sucesso.');
}
