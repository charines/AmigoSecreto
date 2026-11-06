import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { destroyParticipantSession } from '../participantSessionStore.js';
import { getPool } from '../db.js';
import { readParticipantSessionToken } from '../requestSession.js';

export type LogoutResult = {
  status: number;
  body: { ok: boolean };
};

export async function logoutParticipant(pool: Pool, sessionToken: string | undefined): Promise<LogoutResult> {
  if (sessionToken) {
    await destroyParticipantSession(pool, sessionToken);
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

  const result = await logoutParticipant(getPool(config), readParticipantSessionToken(req));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
