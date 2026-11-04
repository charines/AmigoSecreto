import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { randomToken } from '../lib/session.js';
import { createSendMail, type MailMessage } from '../lib/mailer.js';

export type ForgotPasswordResult = {
  status: number;
  body: { ok: boolean; error?: string; message?: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hora

export async function forgotPassword(
  pool: Pool,
  send: (message: MailMessage) => Promise<void>,
  rawEmail: string,
  appBaseUrl: string,
): Promise<ForgotPasswordResult> {
  const email = rawEmail.trim().toLowerCase();

  if (email === '' || !EMAIL_RE.test(email)) {
    return { status: 400, body: { ok: false, error: 'Email invalido' } };
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name FROM admins WHERE email = ? LIMIT 1', [email]);
  const admin = rows[0] as { id: number; name: string } | undefined;

  if (admin) {
    const rawResetToken = randomToken(32);
    const tokenHash = createHash('sha256').update(rawResetToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString().slice(0, 19).replace('T', ' ');

    await pool.query('UPDATE admins SET reset_token_hash = ?, reset_expires = ? WHERE id = ?', [
      tokenHash,
      expiresAt,
      admin.id,
    ]);

    const resetLink = `${appBaseUrl.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(rawResetToken)}`;

    try {
      await send({
        to: email,
        subject: 'Recuperacao de senha — AmigoSecreto',
        text:
          `Ola, ${admin.name}!\n\n` +
          'Recebemos uma solicitacao para redefinir a senha da sua conta no AmigoSecreto.\n\n' +
          `Clique no link abaixo para criar uma nova senha (valido por 1 hora):\n\n${resetLink}\n\n` +
          'Se voce nao solicitou a recuperacao, ignore este e-mail.',
      });
    } catch {
      // Nao expoe falha de SMTP ao cliente.
    }
  }

  return { status: 200, body: { ok: true, message: 'Se esse e-mail estiver cadastrado, um link foi enviado.' } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await forgotPassword(
    getPool(config),
    createSendMail(config.mail),
    String(req.body?.email ?? ''),
    config.app.baseUrl,
  );
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
