import type { ServerResponse } from 'node:http';

export type CorsConfig = {
  origin: string;
};

export type CorsResponse = {
  headers: Record<string, string>;
  status?: number;
};

export function buildCorsResponse(config: CorsConfig, method: string): CorsResponse {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': config.origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (config.origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  if (method === 'OPTIONS') {
    return { headers, status: 204 };
  }

  return { headers };
}

// Usa setHeader, nunca writeHead: writeHead congela o status e o res.statusCode
// definido depois pelo handler seria ignorado (todo erro sairia como 200).
export function applyCors(res: ServerResponse, cors: CorsResponse): boolean {
  for (const [key, value] of Object.entries(cors.headers)) {
    res.setHeader(key, value);
  }
  if (cors.status === 204) {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
