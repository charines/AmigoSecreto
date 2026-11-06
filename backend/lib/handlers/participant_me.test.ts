import { describe, expect, it, vi } from 'vitest';
import { getCurrentParticipant } from './participant_me.js';

describe('getCurrentParticipant', () => {
  it('returns 401 when there is no session token', async () => {
    const pool = { query: vi.fn() };

    const result = await getCurrentParticipant(pool as never, undefined);

    expect(result).toEqual({ status: 401, body: { ok: false, error: 'Nao autorizado' } });
  });

  it('returns 401 when the token does not resolve to a live session', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getCurrentParticipant(pool as never, 'expired-token');

    expect(result).toEqual({ status: 401, body: { ok: false, error: 'Nao autorizado' } });
  });

  it('returns the participant account when the session resolves', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ participant_account_id: 42 }]])
        .mockResolvedValueOnce([[{ id: 42, email: 'p@example.com' }]]),
    };

    const result = await getCurrentParticipant(pool as never, 'valid-token');

    expect(result).toEqual({
      status: 200,
      body: { ok: true, participant: { id: 42, email: 'p@example.com' } },
    });
  });
});
