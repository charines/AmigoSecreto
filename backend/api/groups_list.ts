import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';

export type ListGroupsResult = {
  status: number;
  body: { ok: boolean; groups: RowDataPacket[] };
};

export async function listGroups(pool: Pool, adminId: number): Promise<ListGroupsResult> {
  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT g.id, g.title, g.description, g.draw_date, g.budget_limit, g.status, g.dharma_code, g.created_at, ' +
      '(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id) AS total_participants, ' +
      "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'confirmed') AS confirmed_count, " +
      "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'token_sent') AS token_sent_count, " +
      "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'revealed') AS revealed_count " +
      'FROM `groups` g WHERE g.admin_id = ? ORDER BY g.created_at DESC',
    [adminId],
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
  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const result = await listGroups(pool, admin.id);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
