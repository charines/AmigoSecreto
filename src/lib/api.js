export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: 'Resposta invalida do servidor' };
  }
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API nao configurada (VITE_API_BASE_URL)');
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await parseJsonResponse(response);
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || 'Erro na requisicao');
  }
  return data;
}

export function apiGet(path) {
  return apiRequest(path, { method: 'GET' });
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });
}
