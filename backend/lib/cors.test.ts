import { describe, expect, it } from 'vitest';
import { buildCorsResponse } from './cors.js';

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
