import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { MailMessage } from '../mailer.js';
import { buildDrawResultEmail } from '../drawResultEmail.js';

export type ResendDrawResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type Row = RowDataPacket & {
  id: number;
  reveal_token: string | null;
  token_raw: string | null;
  name: string;
  email: string;
  group_title: string;
  group_description: string;
  group_draw_date: string | null;
};

export async function resendDraw(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  adminId: number,
  participantId: number,
  baseUrl: string,
): Promise<ResendDrawResult> {
  if (participantId <= 0) {
    return { status: 400, body: { ok: false, error: 'Participante invalido' } };
  }

  const [rows] = await pool.query<Row[]>(
    'SELECT p.id, p.reveal_token, p.name, p.email, g.title AS group_title, g.description AS group_description, ' +
      'g.draw_date AS group_draw_date, dr.token_raw ' +
      'FROM participants p ' +
      'JOIN `groups` g ON p.group_id = g.id ' +
      'JOIN draw_results dr ON p.id = dr.giver_id ' +
      'WHERE p.id = ? AND g.admin_id = ? LIMIT 1',
    [participantId, adminId],
  );
  const row = rows[0];
  if (!row) {
    return {
      status: 404,
      body: { ok: false, error: 'Participante nao encontrado, sem permissao ou sorteio ainda nao realizado.' },
    };
  }
  if (!row.token_raw) {
    return {
      status: 400,
      body: { ok: false, error: 'Nao e possivel reenviar o sorteio para este participante (token nao armazenado).' },
    };
  }

  const revealLink =
    `${baseUrl.replace(/\/+$/, '')}/reveal?token=${encodeURIComponent(row.reveal_token ?? '')}` +
    `&code=${encodeURIComponent(row.token_raw)}`;
  const email = buildDrawResultEmail({
    participantName: row.name,
    groupTitle: row.group_title,
    groupDescription: row.group_description,
    drawDate: row.group_draw_date,
    revealLink,
    accessCode: row.token_raw,
    resend: true,
  });

  await sendMail({ to: row.email, subject: email.subject, text: email.text, html: email.html });
  await pool.query('UPDATE participants SET token_sent_at = NOW() WHERE id = ?', [row.id]);

  return { status: 200, body: { ok: true } };
}
