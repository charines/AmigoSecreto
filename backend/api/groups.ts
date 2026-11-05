import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { requireAdmin } from '../lib/requireAdmin.js';
import { readSessionToken } from '../lib/requestSession.js';
import { createSendMail } from '../lib/mailer.js';
import { createGroup } from '../lib/handlers/groups_create.js';
import { listGroups } from '../lib/handlers/groups_list.js';
import { getGroupDetail } from '../lib/handlers/groups_detail.js';
import { deleteGroup } from '../lib/handlers/groups_delete.js';
import { inviteParticipants } from '../lib/handlers/groups_invite.js';
import { getPublicGroup } from '../lib/handlers/groups_get_public.js';
import { joinGroup } from '../lib/handlers/groups_join.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);
  const action = String(req.query?.action ?? '');

  if (action === 'get_public') {
    const result = await getPublicGroup(pool, String(req.query?.code ?? ''));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'join') {
    const result = await joinGroup(
      pool,
      createSendMail(config.mail),
      {
        code: String(req.body?.code ?? ''),
        name: String(req.body?.name ?? ''),
        email: String(req.body?.email ?? ''),
      },
      config.app.baseUrl,
    );
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  const admin = await requireAdmin(pool, readSessionToken(req));
  if (!admin) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Nao autorizado' }));
    return;
  }

  if (action === 'create') {
    const result = await createGroup(pool, admin.id, {
      title: String(req.body?.title ?? ''),
      description: String(req.body?.description ?? ''),
      draw_date: String(req.body?.draw_date ?? ''),
      budget_limit: String(req.body?.budget_limit ?? ''),
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'list') {
    const result = await listGroups(pool, admin.id);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'detail') {
    const result = await getGroupDetail(pool, admin.id, Number(req.query?.id ?? 0));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'delete') {
    const result = await deleteGroup(pool, admin.id, Number(req.body?.group_id ?? 0));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  if (action === 'invite') {
    const result = await inviteParticipants(pool, createSendMail(config.mail), admin.id, {
      group_id: Number(req.body?.group_id ?? 0),
      participants: Array.isArray(req.body?.participants) ? req.body.participants : [],
      baseUrl: config.app.baseUrl,
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  res.statusCode = 400;
  res.end(JSON.stringify({ ok: false, error: 'Acao invalida' }));
}
