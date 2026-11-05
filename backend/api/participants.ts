import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';
import { createSendMail } from '../lib/mailer.js';
import { deleteParticipant } from '../lib/handlers/participants_delete.js';
import { resendInvite } from '../lib/handlers/participants_resend_invite.js';
import { resendDraw } from '../lib/handlers/participants_resend_draw.js';

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

  const action = String(req.query?.action ?? '');
  const participantId = Number(req.body?.participant_id ?? 0);

  if (action === 'delete') {
    const result = await deleteParticipant(pool, admin.id, participantId);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'resend_invite') {
    const result = await resendInvite(pool, createSendMail(config.mail), admin.id, participantId, config.app.baseUrl);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'resend_draw') {
    const result = await resendDraw(pool, createSendMail(config.mail), admin.id, participantId, config.app.baseUrl);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ ok: false, error: 'Acao invalida' }));
}
