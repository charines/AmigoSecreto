import type { Pool, RowDataPacket } from 'mysql2/promise';
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
