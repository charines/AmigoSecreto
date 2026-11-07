import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { confirmInvite } from '../lib/handlers/invite_confirm.js';
import { getInvite } from '../lib/handlers/invite_get.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  if (req.method === 'POST') {
    const result = await confirmInvite(getPool(config), String(req.body?.token ?? ''));
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  const result = await getInvite(getPool(config), String(req.query?.token ?? ''));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
