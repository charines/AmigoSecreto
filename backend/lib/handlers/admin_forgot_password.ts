import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { randomToken } from '../session.js';
import type { MailMessage } from '../mailer.js';
import { renderEmailLayout } from '../emailLayout.js';
import { escapeHtml } from '../htmlEscape.js';

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
      const html = renderEmailLayout({
        previewText: 'Redefina sua senha do Amigo Secreto.',
        heading: '🔒 Redefinir senha',
        bodyHtml: `
          <p>Oi, ${escapeHtml(admin.name)}!</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no Amigo Secreto.</p>
          <p>O link abaixo é válido por 1 hora. Se você não solicitou a recuperação, pode ignorar este e-mail com tranquilidade.</p>
        `,
        ctaLabel: 'Criar nova senha',
        ctaUrl: resetLink,
      });

      await send({
        to: email,
        subject: '🔒 Redefinição de senha — Amigo Secreto',
        text:
          `Oi, ${admin.name}!\n\n` +
          'Recebemos uma solicitação para redefinir a senha da sua conta no Amigo Secreto.\n\n' +
          `O link abaixo é válido por 1 hora. Clique para criar uma nova senha:\n\n${resetLink}\n\n` +
          'Se você não solicitou a recuperação, pode ignorar este e-mail com tranquilidade.',
        html,
      });
    } catch {
      // Nao expoe falha de SMTP ao cliente.
    }
  }

  return { status: 200, body: { ok: true, message: 'Se esse e-mail estiver cadastrado, um link foi enviado.' } };
}
