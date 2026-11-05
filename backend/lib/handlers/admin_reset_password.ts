import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { getPool } from '../db.js';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await resetPassword(getPool(config), String(req.body?.token ?? ''), String(req.body?.password ?? ''));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
