import type { Pool, RowDataPacket } from 'mysql2/promise';

export type InviteResult = {
  status: number;
  body: {
    ok: boolean;
    error?: string;
    participant?: { id: number; name: string; email: string; status: string };
    group?: { title: string; description: string; status: string };
  };
};

type InviteRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  status: string;
  title: string;
  description: string;
  group_status: string;
};

export async function getInvite(pool: Pool, rawToken: string): Promise<InviteResult> {
  const token = rawToken.trim();
  if (token === '') {
    return { status: 400, body: { ok: false, error: 'Token invalido' } };
  }

  const [rows] = await pool.query<InviteRow[]>(
    'SELECT p.id, p.name, p.email, p.status, g.title, g.description, g.status AS group_status ' +
      'FROM participants p INNER JOIN `groups` g ON g.id = p.group_id WHERE p.invite_token = ? LIMIT 1',
    [token],
  );
  const row = rows[0];
  if (!row) {
    return { status: 404, body: { ok: false, error: 'Convite nao encontrado' } };
  }
  if (row.group_status === 'cancelled') {
    return { status: 400, body: { ok: false, error: 'Grupo cancelado' } };
  }

  let status = row.status;
  if (status === 'invited') {
    await pool.query("UPDATE participants SET status = 'link_clicked', invite_clicked_at = NOW() WHERE id = ?", [
      row.id,
    ]);
    status = 'link_clicked';
  }

  return {
    status: 200,
    body: {
      ok: true,
      participant: { id: row.id, name: row.name, email: row.email, status },
      group: { title: row.title, description: row.description, status: row.group_status },
    },
  };
}
