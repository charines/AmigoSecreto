import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { hashPassword } from '../password.js';

export type ResetPasswordResult = {
  status: number;
  body: { ok: boolean; error?: string; message?: string };
};

export async function resetPassword(pool: Pool, rawToken: string, password: string): Promise<ResetPasswordResult> {
  const token = rawToken.trim();

  if (token === '') {
    return { status: 400, body: { ok: false, error: 'Token invalido ou expirado' } };
  }
  if (password.length < 6) {
    return { status: 400, body: { ok: false, error: 'Senha deve ter no minimo 6 caracteres' } };
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM admins WHERE reset_token_hash = ? AND reset_expires > NOW() LIMIT 1',
    [tokenHash],
  );
  const admin = rows[0] as { id: number } | undefined;

  if (!admin) {
    return { status: 400, body: { ok: false, error: 'Token invalido ou expirado' } };
  }

  const newHash = await hashPassword(password);
  await pool.query('UPDATE admins SET password_hash = ?, reset_token_hash = NULL, reset_expires = NULL WHERE id = ?', [
    newHash,
    admin.id,
  ]);

  return { status: 200, body: { ok: true, message: 'Senha redefinida com sucesso.' } };
}
