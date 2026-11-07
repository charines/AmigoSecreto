import type { Pool, RowDataPacket } from 'mysql2/promise';
import { createSession } from '../sessionStore.js';
import { verifyPassword } from '../password.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  status: number;
  body: { ok: boolean; error?: string; admin?: { id: number; name: string; email: string } };
  sessionToken?: string;
};

type AdminRow = RowDataPacket & { id: number; name: string; email: string; password_hash: string };

export async function loginAdmin(pool: Pool, input: LoginInput): Promise<LoginResult> {
  const email = input.email.trim();
  const password = input.password;

  if (email === '' || password === '') {
    return { status: 400, body: { ok: false, error: 'Email e senha sao obrigatorios' } };
  }

  const [rows] = await pool.query<AdminRow[]>(
    'SELECT id, name, email, password_hash FROM admins WHERE email = ? LIMIT 1',
    [email],
  );
  const admin = rows[0];

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return { status: 401, body: { ok: false, error: 'Credenciais invalidas' } };
  }

  const sessionToken = await createSession(pool, admin.id);

  return {
    status: 200,
    body: { ok: true, admin: { id: admin.id, name: admin.name, email: admin.email } },
    sessionToken,
  };
}
