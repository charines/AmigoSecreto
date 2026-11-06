import { describe, expect, it, vi } from 'vitest';
import { requireParticipant } from './requireParticipant.js';

describe('requireParticipant', () => {
  it('returns null when there is no session token', async () => {
    const pool = { query: vi.fn() };

    const account = await requireParticipant(pool as never, undefined);

    expect(account).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns null when the session does not resolve', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const account = await requireParticipant(pool as never, 'expired-token');

    expect(account).toBeNull();
  });

  it('returns the participant account when the session is valid', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ participant_account_id: 7 }]])
        .mockResolvedValueOnce([[{ id: 7, email: 'p@example.com' }]]),
    };

    const account = await requireParticipant(pool as never, 'valid-token');

    expect(account).toEqual({ id: 7, email: 'p@example.com' });
  });
});
