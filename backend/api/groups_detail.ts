import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';

export type GroupDetailResult = {
  status: number;
  body: { ok: boolean; error?: string; group?: RowDataPacket; participants?: RowDataPacket[] };
};

export async function getGroupDetail(pool: Pool, adminId: number, groupId: number): Promise<GroupDetailResult> {
  if (groupId <= 0) {
    return { status: 400, body: { ok: false, error: 'ID invalido' } };
  }

  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT id, title, description, draw_date, budget_limit, status, dharma_code, created_at ' +
      'FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1',
    [groupId, adminId],
  );
  const group = groups[0];
  if (!group) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado' } };
  }

  const [participants] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, status, invite_sent_at, invite_clicked_at, confirmed_at, token_sent_at, revealed_at, created_at ' +
      'FROM participants WHERE group_id = ? ORDER BY created_at ASC',
    [groupId],
  );

  return { status: 200, body: { ok: true, group, participants } };
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

  const groupId = Number(req.query?.id ?? 0);
  const result = await getGroupDetail(pool, admin.id, groupId);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
