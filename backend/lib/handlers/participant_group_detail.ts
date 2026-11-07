import type { Pool, RowDataPacket } from 'mysql2/promise';

export type ParticipantGroupDetailResult = {
  status: number;
  body: { ok: boolean; error?: string; group?: RowDataPacket; participants?: RowDataPacket[] };
};

export async function getParticipantGroupDetail(
  pool: Pool,
  email: string,
  groupId: number,
): Promise<ParticipantGroupDetailResult> {
  if (!Number.isFinite(groupId) || groupId <= 0) {
    return { status: 400, body: { ok: false, error: 'ID invalido' } };
  }

  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT g.id, g.title, g.description, g.draw_date, g.budget_limit, g.status, g.dharma_code, g.created_at ' +
      'FROM `groups` g INNER JOIN participants p ON p.group_id = g.id ' +
      'WHERE g.id = ? AND p.email = ? LIMIT 1',
    [groupId, email],
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
