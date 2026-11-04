import { describe, expect, it, vi } from 'vitest';
import { loginAdmin } from './admin_login.js';

function fakePool(rows: unknown[]) {
  return { query: vi.fn().mockResolvedValue([rows]) };
}

describe('loginAdmin', () => {
  it('rejects when email or password is missing', async () => {
    const pool = fakePool([]);

    const result = await loginAdmin(pool as never, { email: '', password: '' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Email e senha sao obrigatorios' } });
  });

  it('rejects unknown email with 401 and does not create a session', async () => {
    const pool = fakePool([]);

    const result = await loginAdmin(pool as never, { email: 'nope@example.com', password: 'whatever' });

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ ok: false, error: 'Credenciais invalidas' });
  });

  it('logs in with correct credentials and returns a session token', async () => {
    const { hashPassword } = await import('../lib/password.js');
    const hash = await hashPassword('right-password');
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42, name: 'Charles', email: 'charles@example.com', password_hash: hash }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await loginAdmin(pool as never, { email: 'charles@example.com', password: 'right-password' });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.admin).toEqual({ id: 42, name: 'Charles', email: 'charles@example.com' });
    expect(typeof result.sessionToken).toBe('string');
  });
});
