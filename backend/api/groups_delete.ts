import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';

export type DeleteGroupResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

export async function deleteGroup(pool: Pool, adminId: number, groupId: number): Promise<DeleteGroupResult> {
  if (groupId <= 0) {
    return { status: 400, body: { ok: false, error: 'Grupo invalido' } };
  }

  const [groups] = await pool.query<RowDataPacket[]>('SELECT id FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1', [
    groupId,
    adminId,
  ]);
  if (!groups[0]) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado ou sem permissao' } };
  }

  await pool.query('DELETE FROM `groups` WHERE id = ?', [groupId]);

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

  const pool = getPool(config);
  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const groupId = Number(req.body?.group_id ?? 0);
  const result = await deleteGroup(pool, admin.id, groupId);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
