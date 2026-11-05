import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../config.js';
import { buildCorsResponse } from '../cors.js';
import { buildSessionCookieOptions } from '../session.js';
import { createSession } from '../sessionStore.js';
import { getPool } from '../db.js';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await loginAdmin(getPool(config), {
    email: String(req.body?.email ?? ''),
    password: String(req.body?.password ?? ''),
  });

  if (result.sessionToken) {
    const options = buildSessionCookieOptions(config.session);
    res.setHeader(
      'Set-Cookie',
      `session=${result.sessionToken}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}${
        options.secure ? '; Secure' : ''
      }`,
    );
  }

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
