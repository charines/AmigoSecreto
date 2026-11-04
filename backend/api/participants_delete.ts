import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';

export type DeleteParticipantResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type Row = RowDataPacket & { id: number; group_id: number; group_status: string };

export async function deleteParticipant(pool: Pool, adminId: number, participantId: number): Promise<DeleteParticipantResult> {
  if (participantId <= 0) {
    return { status: 400, body: { ok: false, error: 'Participante invalido' } };
  }

  const [rows] = await pool.query<Row[]>(
    'SELECT p.id, p.group_id, g.status AS group_status FROM participants p ' +
      'JOIN `groups` g ON p.group_id = g.id WHERE p.id = ? AND g.admin_id = ? LIMIT 1',
    [participantId, adminId],
  );
  const row = rows[0];
  if (!row) {
    return { status: 404, body: { ok: false, error: 'Participante nao encontrado ou sem permissao' } };
  }

  if (row.group_status === 'drawn') {
    await pool.query('DELETE FROM draw_results WHERE group_id = ?', [row.group_id]);
    await pool.query(
      "UPDATE participants SET status = 'confirmed', reveal_token = NULL, token_sent_at = NULL, revealed_at = NULL " +
        "WHERE group_id = ? AND status IN ('token_sent', 'revealed')",
      [row.group_id],
    );
    await pool.query("UPDATE `groups` SET status = 'open' WHERE id = ?", [row.group_id]);
  }

  await pool.query('DELETE FROM participants WHERE id = ?', [participantId]);

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

  const result = await deleteParticipant(pool, admin.id, Number(req.body?.participant_id ?? 0));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
