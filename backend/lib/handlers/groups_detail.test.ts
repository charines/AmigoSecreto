import { describe, expect, it, vi } from 'vitest';
import { getGroupDetail } from './groups_detail.js';

describe('getGroupDetail', () => {
  it('rejects an invalid id', async () => {
    const pool = { query: vi.fn() };

    const result = await getGroupDetail(pool as never, 7, 0);

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'ID invalido' } });
  });

  it('returns 404 when the group does not belong to the admin', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getGroupDetail(pool as never, 7, 99);

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('returns the group with its participants', async () => {
    const group = { id: 99, title: 'Natal', admin_id: 7 };
    const participants = [{ id: 1, name: 'Ana' }];
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[group]])
        .mockResolvedValueOnce([participants]),
    };

    const result = await getGroupDetail(pool as never, 7, 99);

    expect(result).toEqual({ status: 200, body: { ok: true, group, participants } });
  });
});
