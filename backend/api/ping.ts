import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { checkHealth } from '../lib/handlers/ping_check.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);

  if (cors.status === 204) {
    res.end();
    return;
  }

  const result = await checkHealth(getPool(config));
  res.end(JSON.stringify(result));
}
