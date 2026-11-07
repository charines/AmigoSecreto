import type { Pool, RowDataPacket } from 'mysql2/promise';

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
