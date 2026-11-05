import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { destroySession } from '../sessionStore.js';
import { getPool } from '../db.js';
import { readSessionToken } from '../requestSession.js';

export type LogoutResult = {
  status: number;
  body: { ok: boolean };
};

export async function logoutAdmin(pool: Pool, sessionToken: string | undefined): Promise<LogoutResult> {
  if (sessionToken) {
    await destroySession(pool, sessionToken);
  }
  return { status: 200, body: { ok: true } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await logoutAdmin(getPool(config), readSessionToken(req));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
