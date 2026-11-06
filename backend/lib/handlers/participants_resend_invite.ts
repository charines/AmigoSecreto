import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { getPool } from '../db.js';
import { requireAdmin } from '../requireAdmin.js';
import { readSessionToken } from '../requestSession.js';
import { buildInviteEmail } from '../inviteEmail.js';
import { createSendMail, type MailMessage } from '../mailer.js';

export type ResendInviteResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type Row = RowDataPacket & {
  id: number;
  status: string;
  invite_token: string;
  email: string;
  group_title: string;
  group_description: string;
};

export async function resendInvite(
  pool: Pool,
  sendMail: (message: MailMessage) => Promise<void>,
  adminId: number,
  participantId: number,
  baseUrl: string,
): Promise<ResendInviteResult> {
  if (participantId <= 0) {
    return { status: 400, body: { ok: false, error: 'Participante invalido' } };
  }

  const [rows] = await pool.query<Row[]>(
    'SELECT p.id, p.status, p.invite_token, p.email, g.title AS group_title, g.description AS group_description ' +
      'FROM participants p JOIN `groups` g ON p.group_id = g.id WHERE p.id = ? AND g.admin_id = ? LIMIT 1',
    [participantId, adminId],
  );
  const row = rows[0];
  if (!row) {
    return { status: 404, body: { ok: false, error: 'Participante nao encontrado ou sem permissao' } };
  }
  if (row.status === 'token_sent' || row.status === 'revealed') {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Nao e possivel reenviar convite para um participante que ja recebeu o token do sorteio ou ja o revelou.',
      },
    };
  }

  const inviteLink = `${baseUrl.replace(/\/+$/, '')}/invite?token=${encodeURIComponent(row.invite_token)}`;
  const email = buildInviteEmail({
    groupTitle: row.group_title,
    groupDescription: row.group_description,
    inviteLink,
    resend: true,
  });

  await sendMail({ to: row.email, subject: email.subject, text: email.text, html: email.html });
  await pool.query('UPDATE participants SET invite_sent_at = NOW() WHERE id = ?', [row.id]);

  return { status: 200, body: { ok: true } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);
  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const result = await resendInvite(
    pool,
    createSendMail(config.mail),
    admin.id,
    Number(req.body?.participant_id ?? 0),
    config.app.baseUrl,
  );

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
