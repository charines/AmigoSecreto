import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { getPool } from '../db.js';
import { hashPassword } from '../password.js';

export type SetPasswordInput = {
  token: string;
  password: string;
};

export type SetPasswordResult = {
  status: number;
  body: { ok: boolean; error?: string };
};

type ParticipantRow = RowDataPacket & { id: number; email: string; status: string };

export async function setParticipantPassword(pool: Pool, input: SetPasswordInput): Promise<SetPasswordResult> {
  const token = input.token.trim();
  const password = input.password;

  if (token === '' || password === '') {
    return { status: 400, body: { ok: false, error: 'Token e senha sao obrigatorios' } };
  }
  if (password.length < 6) {
    return { status: 400, body: { ok: false, error: 'Senha muito curta' } };
  }

  const [rows] = await pool.query<ParticipantRow[]>(
    'SELECT id, email, status FROM participants WHERE invite_token = ? LIMIT 1',
    [token],
  );
  const participant = rows[0];
  if (!participant) {
    return { status: 404, body: { ok: false, error: 'Convite nao encontrado' } };
  }
  if (participant.status !== 'confirmed') {
    return { status: 400, body: { ok: false, error: 'Confirme sua participacao antes de criar uma senha' } };
  }

  const hash = await hashPassword(password);
  await pool.query(
    'INSERT INTO participant_accounts (email, password_hash) VALUES (?, ?) ' +
      'ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
    [participant.email, hash],
  );

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

  const result = await setParticipantPassword(getPool(config), {
    token: String(req.body?.token ?? ''),
    password: String(req.body?.password ?? ''),
  });
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
