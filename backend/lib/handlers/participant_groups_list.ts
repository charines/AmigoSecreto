import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { getPool } from '../db.js';
import { requireParticipant } from '../requireParticipant.js';
import { readParticipantSessionToken } from '../requestSession.js';

export type ListParticipantGroupsResult = {
  status: number;
  body: { ok: boolean; groups: RowDataPacket[] };
};

export async function listParticipantGroups(pool: Pool, email: string): Promise<ListParticipantGroupsResult> {
  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT g.id, g.title, g.description, g.draw_date, g.budget_limit, g.status, g.dharma_code, g.created_at, ' +
      '(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id) AS total_participants, ' +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'confirmed') AS confirmed_count, " +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'token_sent') AS token_sent_count, " +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'revealed') AS revealed_count " +
      'FROM `groups` g INNER JOIN participants p ON p.group_id = g.id ' +
      'WHERE p.email = ? GROUP BY g.id ORDER BY g.created_at DESC',
    [email],
  );

  return { status: 200, body: { ok: true, groups } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);
  const account = await requireParticipant(pool, readParticipantSessionToken(req));
  if (!account) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const result = await listParticipantGroups(pool, account.email);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
