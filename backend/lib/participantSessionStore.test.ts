import { describe, expect, it, vi } from 'vitest';
import { createParticipantSession, destroyParticipantSession, resolveParticipantSession } from './participantSessionStore.js';

function fakePool() {
  return { query: vi.fn() };
}

describe('participantSessionStore', () => {
  it('creates a session row and returns a raw token', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([{}]);

    const token = await createParticipantSession(pool as never, 42);

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO participant_sessions'),
      expect.arrayContaining([expect.any(String), 42, expect.any(String)]),
    );
  });

  it('resolves a valid, non-expired token to its participant account id', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([[{ participant_account_id: 42 }]]);

    const accountId = await resolveParticipantSession(pool as never, 'some-raw-token');

    expect(accountId).toBe(42);
  });

  it('returns null when the token does not match any live session', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([[]]);

    const accountId = await resolveParticipantSession(pool as never, 'unknown-token');

    expect(accountId).toBeNull();
  });

  it('deletes the session row on destroy', async () => {
    const pool = fakePool();
    pool.query.mockResolvedValue([{}]);

    await destroyParticipantSession(pool as never, 'some-raw-token');

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM participant_sessions'),
      expect.arrayContaining([expect.any(String)]),
    );
  });
});
