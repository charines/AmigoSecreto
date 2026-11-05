import { describe, expect, it, vi } from 'vitest';
import { logoutAdmin } from './admin_logout.js';

describe('logoutAdmin', () => {
  it('destroys the session when a token is present', async () => {
    const pool = { query: vi.fn().mockResolvedValue([{}]) };

    const result = await logoutAdmin(pool as never, 'some-token');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalled();
  });

  it('succeeds even without a token (idempotent)', async () => {
    const pool = { query: vi.fn() };

    const result = await logoutAdmin(pool as never, undefined);

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
