import { describe, expect, it, vi } from 'vitest';
import { requireAdmin } from './requireAdmin.js';

describe('requireAdmin', () => {
  it('returns null when there is no session token', async () => {
    const pool = { query: vi.fn() };

    const admin = await requireAdmin(pool as never, undefined);

    expect(admin).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns null when the session does not resolve', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const admin = await requireAdmin(pool as never, 'expired-token');

    expect(admin).toBeNull();
  });

  it('returns the admin when the session is valid', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ admin_id: 7 }]])
        .mockResolvedValueOnce([[{ id: 7, name: 'Charles', email: 'c@example.com' }]]),
    };

    const admin = await requireAdmin(pool as never, 'valid-token');

    expect(admin).toEqual({ id: 7, name: 'Charles', email: 'c@example.com' });
  });
});
