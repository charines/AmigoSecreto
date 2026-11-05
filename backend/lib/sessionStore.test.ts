import { describe, expect, it, vi } from 'vitest';
import { createSession, destroySession, resolveSession } from './sessionStore.js';

function fakePool() {
  return { query: vi.fn() };
}

describe('sessionStore', () => {
  it('creates a session row and returns a raw token', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([{}]);

    const token = await createSession(pool as never, 42);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sessions'),
      expect.arrayContaining([expect.any(String), 42, expect.any(String)]),
    );
  });

  it('resolves a valid, non-expired token to its admin id', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([[{ admin_id: 42 }]]);

    const adminId = await resolveSession(pool as never, 'some-raw-token');

    expect(adminId).toBe(42);
  });

  it('returns null when the token does not match any live session', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([[]]);

    const adminId = await resolveSession(pool as never, 'unknown-token');

    expect(adminId).toBeNull();
  });

  it('deletes the session row on destroy', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([{}]);

    await destroySession(pool as never, 'some-raw-token');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM sessions'),
      expect.arrayContaining([expect.any(String)]),
    );
  });
});
