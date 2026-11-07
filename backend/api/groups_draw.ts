import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';
import { createSendMail } from '../lib/mailer.js';
import { runDraw } from '../lib/handlers/groups_draw.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);
  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  const result = await runDraw(
    pool,
    createSendMail(config.mail),
    admin.id,
    Number(req.body?.group_id ?? 0),
    config.app.baseUrl,
  );

  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
