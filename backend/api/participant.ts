import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { buildSessionCookieOptions } from '../lib/session.js';
import { getPool } from '../lib/db.js';
import { readParticipantSessionToken } from '../lib/requestSession.js';
import { requireParticipant } from '../lib/requireParticipant.js';
import { loginParticipant } from '../lib/handlers/participant_login.js';
import { logoutParticipant } from '../lib/handlers/participant_logout.js';
import { getCurrentParticipant } from '../lib/handlers/participant_me.js';
import { setParticipantPassword } from '../lib/handlers/participant_set_password.js';
import { listParticipantGroups } from '../lib/handlers/participant_groups_list.js';
import { getParticipantGroupDetail } from '../lib/handlers/participant_group_detail.js';

function setSessionCookie(res: VercelResponse, sessionToken: string, config: ReturnType<typeof loadConfig>) {
  const options = buildSessionCookieOptions(config.session);
  res.setHeader(
    'Set-Cookie',
    `participant_session=${sessionToken}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}${
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

  if (action === 'set_password') {
    const result = await setParticipantPassword(pool, {
      token: String(req.body?.token ?? ''),
      password: String(req.body?.password ?? ''),
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'login') {
    const result = await loginParticipant(pool, {
      email: String(req.body?.email ?? ''),
      password: String(req.body?.password ?? ''),
    });
    if (result.sessionToken) setSessionCookie(res, result.sessionToken, config);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'logout') {
    const result = await logoutParticipant(pool, readParticipantSessionToken(req));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'me') {
    const result = await getCurrentParticipant(pool, readParticipantSessionToken(req));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'groups') {
    const account = await requireParticipant(pool, readParticipantSessionToken(req));
    if (!account) {
      res.statusCode = 401;
      res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
      return;
    }
    const result = await listParticipantGroups(pool, account.email);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'group_detail') {
    const account = await requireParticipant(pool, readParticipantSessionToken(req));
    if (!account) {
      res.statusCode = 401;
      res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
      return;
    }
    const groupId = Number(req.query?.id ?? 0);
    const result = await getParticipantGroupDetail(pool, account.email, groupId);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ ok: false, error: 'Acao invalida' }));
}
