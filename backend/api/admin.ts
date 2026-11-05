import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { buildSessionCookieOptions } from '../lib/session.js';
import { getPool } from '../lib/db.js';
import { readSessionToken } from '../lib/requestSession.js';
import { createSendMail } from '../lib/mailer.js';
import { loginAdmin } from '../lib/handlers/admin_login.js';
import { logoutAdmin } from '../lib/handlers/admin_logout.js';
import { getCurrentAdmin } from '../lib/handlers/admin_me.js';
import { registerAdmin } from '../lib/handlers/admin_register.js';
import { forgotPassword } from '../lib/handlers/admin_forgot_password.js';
import { resetPassword } from '../lib/handlers/admin_reset_password.js';

function setSessionCookie(res: VercelResponse, sessionToken: string, config: ReturnType<typeof loadConfig>) {
  const options = buildSessionCookieOptions(config.session);
  res.setHeader(
    'Set-Cookie',
    `session=${sessionToken}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}${
      options.secure ? '; Secure' : ''
    }`,
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  for (const [key, value] of Object.entries(cors.headers)) {
    res.setHeader(key, value);
  }
  if (cors.status === 204) {
    res.statusCode = 204;
    res.end();
    return;
  }

  const pool = getPool(config);
  const action = String(req.query?.action ?? '');

  if (action === 'login') {
    const result = await loginAdmin(pool, {
      email: String(req.body?.email ?? ''),
      password: String(req.body?.password ?? ''),
    });
    if (result.sessionToken) setSessionCookie(res, result.sessionToken, config);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'register') {
    const result = await registerAdmin(pool, {
      name: String(req.body?.name ?? ''),
      email: String(req.body?.email ?? ''),
      password: String(req.body?.password ?? ''),
    });
    if (result.sessionToken) setSessionCookie(res, result.sessionToken, config);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'logout') {
    const result = await logoutAdmin(pool, readSessionToken(req));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'me') {
    const result = await getCurrentAdmin(pool, readSessionToken(req));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'forgot_password') {
    const result = await forgotPassword(
      pool,
      createSendMail(config.mail),
      String(req.body?.email ?? ''),
      config.app.baseUrl,
    );
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'reset_password') {
    const result = await resetPassword(pool, String(req.body?.token ?? ''), String(req.body?.password ?? ''));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ ok: false, error: 'Acao invalida' }));
}
