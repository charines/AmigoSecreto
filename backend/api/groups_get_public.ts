import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';

export type PublicGroupResult = {
  status: number;
  body: { ok: boolean; error?: string; group?: RowDataPacket };
};

export async function getPublicGroup(pool: Pool, rawCode: string): Promise<PublicGroupResult> {
  const code = rawCode.trim();
  if (code === '') {
    return { status: 400, body: { ok: false, error: 'Codigo ausente' } };
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, title, description, draw_date, budget_limit, status FROM `groups` WHERE dharma_code = ? LIMIT 1',
    [code],
  );
  const group = rows[0];
  if (!group) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado' } };
  }
  if (group.status !== 'open') {
    return { status: 400, body: { ok: false, error: 'Este grupo ja encerrou as inscricoes' } };
  }

  return { status: 200, body: { ok: true, group } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await getPublicGroup(getPool(config), String(req.query?.code ?? ''));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
