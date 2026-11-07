import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { randomToken } from '../session.js';
import { buildInviteEmail } from '../inviteEmail.js';
import type { MailMessage } from '../mailer.js';

export type JoinGroupInput = { code: string; name: string; email: string };

export type JoinGroupResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinGroup(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  input: JoinGroupInput,
  baseUrl: string,
): Promise<JoinGroupResult> {
  const code = input.code.trim();
  const name = input.name.trim();
  const email = input.email.trim();

  if (code === '' || name === '' || email === '') {
    return { status: 400, body: { ok: false, error: 'Dados incompletos' } };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: 400, body: { ok: false, error: 'E-mail invalido' } };
  }

  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT id, title, description, draw_date, status FROM `groups` WHERE dharma_code = ? LIMIT 1',
    [code],
  );
  const group = groups[0] as { id: number; title: string; description: string; status: string } | undefined;
  if (!group) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado' } };
  }
  if (group.status !== 'open') {
    return { status: 400, body: { ok: false, error: 'Inscricoes encerradas para este grupo' } };
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM participants WHERE group_id = ? AND email = ? LIMIT 1',
    [group.id, email],
  );
  if (existing[0]) {
    return { status: 400, body: { ok: false, error: 'Este e-mail ja esta registrado neste grupo' } };
  }

  const inviteToken = randomToken(32);
  const [insertResult] = await pool.query<ResultSetHeader>(
    'INSERT INTO participants (group_id, name, email, status, invite_token) VALUES (?, ?, ?, ?, ?)',
    [group.id, name, email, 'invited', inviteToken],
  );

  const inviteLink = `${baseUrl.replace(/\/+$/, '')}/invite?token=${encodeURIComponent(inviteToken)}`;
  const mail = buildInviteEmail({
    groupTitle: group.title,
    groupDescription: group.description,
    inviteLink,
    resend: false,
  });

  await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html });
  await pool.query('UPDATE participants SET invite_sent_at = NOW() WHERE id = ?', [insertResult.insertId]);

  return { status: 200, body: { ok: true } };
}
