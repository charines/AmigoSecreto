import { describe, expect, it, vi } from 'vitest';
import { getParticipantGroupDetail } from './participant_group_detail.js';

describe('getParticipantGroupDetail', () => {
  it('rejects an invalid id', async () => {
    const pool = { query: vi.fn() };

    const result = await getParticipantGroupDetail(pool as never, 'p@example.com', 0);

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'ID invalido' } });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric id (NaN) instead of hitting the database', async () => {
    const pool = { query: vi.fn() };

    const result = await getParticipantGroupDetail(pool as never, 'p@example.com', Number('abc'));

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'ID invalido' } });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 404 when the email has no participant row in that group', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getParticipantGroupDetail(pool as never, 'outsider@example.com', 1);

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('returns the group and its participants when the email belongs to the group', async () => {
    const group = { id: 1, title: 'Natal 2026', status: 'open', draw_date: null, dharma_code: 'ABC123' };
    const participants = [{ id: 10, name: 'Fulano', email: 'p@example.com', status: 'confirmed' }];
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[group]])
        .mockResolvedValueOnce([participants]),
    };

    const result = await getParticipantGroupDetail(pool as never, 'p@example.com', 1);

    expect(result).toEqual({ status: 200, body: { ok: true, group, participants } });
  });
});
