import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);

  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await checkHealth(getPool(config));
  res.end(JSON.stringify(result));
}
