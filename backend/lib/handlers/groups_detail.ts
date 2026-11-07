import type { Pool, RowDataPacket } from 'mysql2/promise';

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
