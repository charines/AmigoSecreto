import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { applyCors, buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { confirmReveal } from '../lib/handlers/reveal_confirm.js';

export type RevealResult = {
  status: number;
  body: {
    ok: boolean;
    error?: string;
    giver?: { id: number; name: string; status: string };
    group?: { title: string; status: string };
    payload?: { encrypted: string; iv_b64: string };
  };
};

type Row = RowDataPacket & {
  id: number;
  name: string;
  status: string;
  title: string;
  group_status: string;
  encrypted_payload: string;
  iv_b64: string;
};

export async function getReveal(pool: Pool, rawToken: string): Promise<RevealResult> {
  const token = rawToken.trim();
  if (token === '') {
    return { status: 400, body: { ok: false, error: 'Token invalido' } };
  }

  const [rows] = await pool.query<Row[]>(
    'SELECT p.id, p.name, p.status, g.title, g.status AS group_status, ' +
      'dr.encrypted_payload, dr.iv_b64 ' +
      'FROM participants p ' +
      'INNER JOIN `groups` g ON g.id = p.group_id ' +
      'INNER JOIN draw_results dr ON dr.giver_id = p.id ' +
      'WHERE p.reveal_token = ? LIMIT 1',
    [token],
  );
  const row = rows[0];
  if (!row) {
    return { status: 404, body: { ok: false, error: 'Link invalido' } };
  }
  if (row.group_status !== 'drawn') {
    return { status: 400, body: { ok: false, error: 'Sorteio ainda nao foi concluido' } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      giver: { id: row.id, name: row.name, status: row.status },
      group: { title: row.title, status: row.group_status },
      payload: { encrypted: row.encrypted_payload, iv_b64: row.iv_b64 },
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  if (applyCors(res, cors)) return;

  if (req.method === 'POST') {
    const result = await confirmReveal(getPool(config), String(req.body?.token ?? ''));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  const result = await getReveal(getPool(config), String(req.query?.token ?? ''));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
