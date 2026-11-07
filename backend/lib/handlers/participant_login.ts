import type { Pool, RowDataPacket } from 'mysql2/promise';
import { createParticipantSession } from '../participantSessionStore.js';
import { verifyPassword } from '../password.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  status: number;
  body: { ok: boolean; error?: string; participant?: { id: number; email: string } };
  sessionToken?: string;
};

type ParticipantAccountRow = RowDataPacket & { id: number; email: string; password_hash: string };

export async function loginParticipant(pool: Pool, input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim();
  const password = input.password;

  if (email === '' || password === '') {
    return { status: 400, body: { ok: false, error: 'Email e senha sao obrigatorios' } };
  }

  const [rows] = await pool.query<ParticipantAccountRow[]>(
    'SELECT id, email, password_hash FROM participant_accounts WHERE email = ? LIMIT 1',
    [email],
  );
  const account = rows[0];

  if (!account || !(await verifyPassword(password, account.password_hash))) {
    return { status: 401, body: { ok: false, error: 'Credenciais invalidas' } };
  }

  const sessionToken = await createParticipantSession(pool, account.id);

  return {
    status: 200,
    body: { ok: true, participant: { id: account.id, email: account.email } },
    sessionToken,
  };
}
