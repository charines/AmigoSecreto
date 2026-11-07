import type { Pool } from 'mysql2/promise';

export type HealthResult = {
  ok: boolean;
  server: boolean;
  db: boolean;
  db_error?: string;
};

export async function checkHealth(pool: Pool): Promise<HealthResult> {
  try {
    await pool.query('SELECT 1');
    return { ok: true, server: true, db: true };
  } catch {
    return { ok: false, server: true, db: false, db_error: 'Banco indisponivel' };
  }
}
