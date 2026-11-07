import type { Pool, RowDataPacket } from 'mysql2/promise';

export type ListParticipantGroupsResult = {
  status: number;
  body: { ok: boolean; groups: RowDataPacket[] };
};

export async function listParticipantGroups(pool: Pool, email: string): Promise<ListParticipantGroupsResult> {
  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT g.id, g.title, g.description, g.draw_date, g.budget_limit, g.status, g.dharma_code, g.created_at, ' +
      '(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id) AS total_participants, ' +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'confirmed') AS confirmed_count, " +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'token_sent') AS token_sent_count, " +
      "(SELECT COUNT(*) FROM participants p2 WHERE p2.group_id = g.id AND p2.status = 'revealed') AS revealed_count " +
      'FROM `groups` g INNER JOIN participants p ON p.group_id = g.id ' +
      'WHERE p.email = ? GROUP BY g.id ORDER BY g.created_at DESC',
    [email],
  );

  return { status: 200, body: { ok: true, groups } };
}
