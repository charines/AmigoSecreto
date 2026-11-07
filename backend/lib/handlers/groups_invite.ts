import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { randomToken } from '../session.js';
import { buildInviteEmail } from '../inviteEmail.js';
import type { MailMessage } from '../mailer.js';

export type ParticipantInput = { name: string; email: string };

export type InviteParticipantsInput = {
  group_id: number;
  participants: ParticipantInput[];
  baseUrl: string;
};

export type InviteParticipantsResult = {
  status: number;
  body: { ok: boolean; error?: string; sent?: string[]; failed?: Array<{ email: string; error: string }> };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteParticipants(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  adminId: number,
  input: InviteParticipantsInput,
): Promise<InviteParticipantsResult> {
  if (input.group_id <= 0 || !Array.isArray(input.participants) || input.participants.length === 0) {
    return { status: 400, body: { ok: false, error: 'Dados invalidos' } };
  }

  const [groups] = await pool.query<RowDataPacket[]>(
    'SELECT id, title, description, status FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1',
    [input.group_id, adminId],
  );
  const group = groups[0] as { id: number; title: string; description: string; status: string } | undefined;
  if (!group) {
    return { status: 404, body: { ok: false, error: 'Grupo nao encontrado' } };
  }
  if (group.status !== 'open') {
    return { status: 400, body: { ok: false, error: 'Grupo nao esta aberto' } };
  }

  const cleaned = input.participants.map((p) => ({ name: p.name.trim(), email: p.email.trim() }));
  for (const p of cleaned) {
    if (p.name === '' || !EMAIL_RE.test(p.email)) {
      return { status: 400, body: { ok: false, error: 'Participante invalido' } };
    }
  }

  const created: Array<{ id: number; name: string; email: string; invite_token: string }> = [];
  for (const p of cleaned) {
    const inviteToken = randomToken(24);
    const [insertResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO participants (group_id, name, email, status, invite_token, invite_sent_at) VALUES (?, ?, ?, ?, ?, ?)',
      [input.group_id, p.name, p.email, 'invited', inviteToken, null],
    );
    created.push({ id: insertResult.insertId, name: p.name, email: p.email, invite_token: inviteToken });
  }

  const sent: string[] = [];
  const failed: Array<{ email: string; error: string }> = [];

  for (const p of created) {
    const inviteLink = `${input.baseUrl.replace(/\/+$/, '')}/invite?token=${encodeURIComponent(p.invite_token)}`;
    const email = buildInviteEmail({
      groupTitle: group.title,
      groupDescription: group.description,
      inviteLink,
      resend: false,
    });

    try {
      await sendMail({ to: p.email, subject: email.subject, text: email.text, html: email.html });
      sent.push(p.email);
      await pool.query('UPDATE participants SET invite_sent_at = NOW() WHERE id = ?', [p.id]);
    } catch (err) {
      failed.push({ email: p.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { status: 200, body: { ok: true, sent, failed } };
}
