import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { resolveParticipantSession } from '../participantSessionStore.js';
import { getPool } from '../db.js';
import { readParticipantSessionToken } from '../requestSession.js';

export type MeResult = {
  status: number;
  body: { ok: boolean; error?: string; participant?: { id: number; email: string } };
};

type ParticipantAccountRow = RowDataPacket & { id: number; email: string };

const UNAUTHORIZED: MeResult = { status: 401, body: { ok: false, error: 'Nao autorizado' } };

export async function getCurrentParticipant(pool: Pool, sessionToken: string | undefined): Promise<MeResult> {
  if (!sessionToken) return UNAUTHORIZED;

  const accountId = await resolveParticipantSession(pool, sessionToken);
  if (!accountId) return UNAUTHORIZED;

  const [rows] = await pool.query<ParticipantAccountRow[]>(
    'SELECT id, email FROM participant_accounts WHERE id = ? LIMIT 1',
    [accountId],
  );
  const account = rows[0];
  if (!account) return UNAUTHORIZED;

  return { status: 200, body: { ok: true, participant: { id: account.id, email: account.email } } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await getCurrentParticipant(getPool(config), readParticipantSessionToken(req));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
