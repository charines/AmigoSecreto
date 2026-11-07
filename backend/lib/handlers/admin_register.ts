import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { createSession } from '../sessionStore.js';
import { hashPassword } from '../password.js';

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResult = {
  status: number;
  body: { ok: boolean; error?: string; admin?: { id: number; name: string; email: string } };
  sessionToken?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAdmin(pool: Pool, input: RegisterInput): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const password = input.password;

  if (name === '' || email === '' || password === '') {
    return { status: 400, body: { ok: false, error: 'Nome, email e senha sao obrigatorios' } };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: 400, body: { ok: false, error: 'Email invalido' } };
  }
  if (password.length < 6) {
    return { status: 400, body: { ok: false, error: 'Senha muito curta' } };
  }

  const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM admins WHERE email = ? LIMIT 1', [email]);
  if (existing[0]) {
    return { status: 409, body: { ok: false, error: 'Email ja cadastrado' } };
  }

  const hash = await hashPassword(password);
  const [insertResult] = await pool.query<ResultSetHeader>(
    'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hash],
  );
  const adminId = insertResult.insertId;

  const sessionToken = await createSession(pool, adminId);

  return {
    status: 200,
    body: { ok: true, admin: { id: adminId, name, email } },
    sessionToken,
  };
}
