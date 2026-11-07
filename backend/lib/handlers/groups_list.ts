import type { Pool, RowDataPacket } from 'mysql2/promise';

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
