import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { buildSessionCookieOptions } from '../lib/session.js';
import { createSession } from '../lib/sessionStore.js';
import { getPool } from '../lib/db.js';
import { hashPassword } from '../lib/password.js';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await registerAdmin(getPool(config), {
    name: String(req.body?.name ?? ''),
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
