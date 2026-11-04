import { describe, expect, it, vi } from 'vitest';
import { registerAdmin } from './admin_register.js';

describe('registerAdmin', () => {
  it('rejects missing fields', async () => {
    const pool = { query: vi.fn() };

    const result = await registerAdmin(pool as never, { name: '', email: '', password: '' });

    expect(result.status).toBe(400);
  });

  it('rejects invalid email', async () => {
    const pool = { query: vi.fn() };

    const result = await registerAdmin(pool as never, { name: 'Charles', email: 'not-an-email', password: '123456' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Email invalido' } });
  });

  it('rejects short password', async () => {
    const pool = { query: vi.fn() };

    const result = await registerAdmin(pool as never, { name: 'Charles', email: 'c@example.com', password: '123' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Senha muito curta' } });
  });

  it('rejects when email already registered', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1 }]]) };

    const result = await registerAdmin(pool as never, {
      name: 'Charles',
      email: 'c@example.com',
      password: '123456',
    });

    expect(result).toEqual({ status: 409, body: { ok: false, error: 'Email ja cadastrado' } });
  });

  it('creates admin and session on success', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[]]) // no existing email
        .mockResolvedValueOnce([{ insertId: 99 }]) // insert
        .mockResolvedValueOnce([{}]), // createSession insert
    };

    const result = await registerAdmin(pool as never, {
      name: 'Charles',
      email: 'c@example.com',
      password: '123456',
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      ok: true,
      admin: { id: 99, name: 'Charles', email: 'c@example.com' },
    });
    expect(typeof result.sessionToken).toBe('string');
  });
});
