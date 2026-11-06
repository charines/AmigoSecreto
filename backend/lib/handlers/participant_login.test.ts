import { describe, expect, it, vi } from 'vitest';
import { loginParticipant } from './participant_login.js';

function fakePool(rows: unknown[]) {
  return { query: vi.fn().mockResolvedValue([rows]) };
}

describe('loginParticipant', () => {
  it('rejects when email or password is missing', async () => {
    const pool = fakePool([]);

    const result = await loginParticipant(pool as never, { email: '', password: '' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Email e senha sao obrigatorios' } });
  });

  it('rejects unknown email with 401 and does not create a session', async () => {
    const pool = fakePool([]);

    const result = await loginParticipant(pool as never, { email: 'nope@example.com', password: 'whatever' });

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ ok: false, error: 'Credenciais invalidas' });
  });

  it('rejects wrong password with the same generic error', async () => {
    const { hashPassword } = await import('../password.js');
    const hash = await hashPassword('right-password');
    const pool = fakePool([{ id: 42, email: 'p@example.com', password_hash: hash }]);

    const result = await loginParticipant(pool as never, { email: 'p@example.com', password: 'wrong-password' });

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ ok: false, error: 'Credenciais invalidas' });
  });

  it('logs in with correct credentials and returns a session token', async () => {
    const { hashPassword } = await import('../password.js');
    const hash = await hashPassword('right-password');
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42, email: 'p@example.com', password_hash: hash }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await loginParticipant(pool as never, { email: 'p@example.com', password: 'right-password' });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.participant).toEqual({ id: 42, email: 'p@example.com' });
    expect(typeof result.sessionToken).toBe('string');
  });
});
