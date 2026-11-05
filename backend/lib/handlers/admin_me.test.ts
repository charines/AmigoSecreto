import { describe, expect, it, vi } from 'vitest';
import { getCurrentAdmin } from './admin_me.js';

describe('getCurrentAdmin', () => {
  it('returns 401 when there is no session token', async () => {
    const pool = { query: vi.fn() };

    const result = await getCurrentAdmin(pool as never, undefined);

    expect(result).toEqual({ status: 401, body: { ok: false, error: 'Nao autorizado' } });
  });

  it('returns 401 when the token does not resolve to a live session', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getCurrentAdmin(pool as never, 'expired-token');

    expect(result).toEqual({ status: 401, body: { ok: false, error: 'Nao autorizado' } });
  });

  it('returns the admin when the session resolves', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ admin_id: 42 }]])
        .mockResolvedValueOnce([[{ id: 42, name: 'Charles', email: 'charles@example.com' }]]),
    };

    const result = await getCurrentAdmin(pool as never, 'valid-token');

    expect(result).toEqual({
      status: 200,
      body: { ok: true, admin: { id: 42, name: 'Charles', email: 'charles@example.com' } },
    });
  });
});
