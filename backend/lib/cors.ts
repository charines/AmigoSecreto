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
