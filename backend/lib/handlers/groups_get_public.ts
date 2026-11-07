import type { Pool, RowDataPacket } from 'mysql2/promise';

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
