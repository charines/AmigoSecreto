import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadConfig } from '../lib/config.js';
import { buildCorsResponse } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { getChatMessages } from '../lib/handlers/chat_get.js';
import { sendChatMessage } from '../lib/handlers/chat_send.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = loadConfig(process.env);
  const cors = buildCorsResponse(config.cors, req.method ?? 'GET');
  res.writeHead(cors.status ?? 200, cors.headers);
  if (cors.status === 204) {
    res.end();
    return;
  }

  const pool = getPool(config);

  if (req.method === 'POST') {
    const result = await sendChatMessage(pool, {
      token: String(req.body?.token ?? ''),
      channel: String(req.body?.channel ?? ''),
      texto: String(req.body?.texto ?? ''),
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
    return;
  }

  const result = await getChatMessages(pool, String(req.query?.token ?? ''));
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
