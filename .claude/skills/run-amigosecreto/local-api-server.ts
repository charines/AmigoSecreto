import { createServer, type IncomingMessage } from 'node:http';
import { pathToFileURL } from 'node:url';

// This file lives at <repo>/.claude/skills/run-amigosecreto/local-api-server.ts
const BACKEND_DIR = new URL('../../../backend', import.meta.url).pathname;
const PORT = Number(process.env.LOCAL_API_PORT ?? 3001);

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const match = url.pathname.match(/^\/api\/([a-zA-Z0-9_]+)$/);

    if (!match) {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: 'Rota nao encontrada' }));
      return;
    }

    const moduleUrl = pathToFileURL(`${BACKEND_DIR}/api/${match[1]}.ts`).href;
    const mod = await import(moduleUrl);
    const handler = mod.default;

    const query: Record<string, string> = {};
    for (const [k, v] of url.searchParams) query[k] = v;

    const rawBody = ['POST', 'PUT', 'PATCH'].includes(req.method ?? '') ? await readBody(req) : '';
    let body: unknown = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = {};
      }
    }

    const vercelReq = Object.assign(req, { query, body, cookies: {} });
    await handler(vercelReq, res);
  } catch (err) {
    console.error('Erro no handler:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'Erro interno (local-api-server)' }));
    } else {
      res.end();
    }
  }
});

server.listen(PORT, () => {
  console.log(`local-api-server rodando em http://localhost:${PORT} (handlers de ${BACKEND_DIR}/api)`);
});
