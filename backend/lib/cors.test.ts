import { createServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyCors, buildCorsResponse } from './cors.js';

describe('buildCorsResponse', () => {
  it('allows a configured origin and marks credentials allowed', () => {
    const response = buildCorsResponse({ origin: 'https://app.example.com' }, 'GET');

    expect(response.headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
    expect(response.headers['Access-Control-Allow-Credentials']).toBe('true');
    expect(response.status).toBeUndefined();
  });

  it('omits credentials header when origin is wildcard', () => {
    const response = buildCorsResponse({ origin: '*' }, 'GET');

    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Credentials']).toBeUndefined();
  });

  it('short-circuits OPTIONS preflight with 204', () => {
    const response = buildCorsResponse({ origin: '*' }, 'OPTIONS');

    expect(response.status).toBe(204);
  });
});

async function request(method: string, handle: (res: ServerResponse) => void) {
  const server = createServer((req, res) => handle(res));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { method });
    return { status: response.status, headers: response.headers, body: await response.text() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

describe('applyCors', () => {
  const cors = (method: string) => buildCorsResponse({ origin: 'https://app.example.com' }, method);

  it('keeps the status set by the handler after CORS headers are applied', async () => {
    const response = await request('GET', (res) => {
      if (applyCors(res, cors('GET'))) return;
      res.statusCode = 401;
      res.end(JSON.stringify({ ok: false, error: 'Nao autenticado' }));
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://app.example.com');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    expect(JSON.parse(response.body)).toEqual({ ok: false, error: 'Nao autenticado' });
  });

  it('answers OPTIONS preflight with 204 and signals the handler to stop', async () => {
    let handled: boolean | undefined;
    const response = await request('OPTIONS', (res) => {
      handled = applyCors(res, cors('OPTIONS'));
    });

    expect(handled).toBe(true);
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, POST, OPTIONS');
  });

  it('is not bypassed by writeHead in any endpoint', () => {
    const apiDir = fileURLToPath(new URL('../api/', import.meta.url));
    const offenders = readdirSync(apiDir)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .filter((file) => readFileSync(`${apiDir}${file}`, 'utf8').includes('writeHead('));

    expect(offenders).toEqual([]);
  });
});
