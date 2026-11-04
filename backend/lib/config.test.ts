import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('reads db credentials from env', () => {
    const config = loadConfig({
      DB_HOST: 'db.example.com',
      DB_NAME: 'secretsanta',
      DB_USER: 'app',
      DB_PASS: 'secret',
    });

    expect(config.db).toEqual({
      host: 'db.example.com',
      name: 'secretsanta',
      user: 'app',
      pass: 'secret',
      charset: 'utf8mb4',
    });
  });

  it('falls back to defaults when env vars are missing', () => {
    const config = loadConfig({});

    expect(config.db.host).toBe('localhost');
    expect(config.cors.origin).toBe('*');
    expect(config.session.samesite).toBe('Lax');
    expect(config.session.secure).toBe(true);
  });
});
