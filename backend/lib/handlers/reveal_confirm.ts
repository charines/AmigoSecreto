import type { Pool, RowDataPacket } from 'mysql2/promise';

export type ConfirmRevealResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type Row = RowDataPacket & { id: number; status: string };

export async function confirmReveal(pool: Pool, rawToken: string): Promise<ConfirmRevealResult> {
  const token = rawToken.trim();
  if (token === '') {
    return { status: 400, body: { ok: false, error: 'Token invalido' } };
  }

  const [rows] = await pool.query<Row[]>('SELECT id, status FROM participants WHERE reveal_token = ? LIMIT 1', [token]);
  const row = rows[0];
  if (!row) {
    return { status: 404, body: { ok: false, error: 'Registro nao encontrado' } };
  }

  if (row.status !== 'revealed') {
    await pool.query("UPDATE participants SET status = 'revealed', revealed_at = NOW() WHERE id = ?", [row.id]);
  }

  return { status: 200, body: { ok: true } };
}
