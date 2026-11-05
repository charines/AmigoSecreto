import { describe, expect, it, vi } from 'vitest';
import { confirmInvite } from './invite_confirm.js';

describe('confirmInvite', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await confirmInvite(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido' } });
  });

  it('returns 404 for unknown token', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await confirmInvite(pool as never, 'unknown');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Convite nao encontrado' } });
  });

  it('rejects when the group is not open', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, status: 'invited', group_status: 'drawn' }]]) };

    const result = await confirmInvite(pool as never, 'token');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo nao esta aberto' } });
  });

  it('confirms the participant when the group is open', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, status: 'link_clicked', group_status: 'open' }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await confirmInvite(pool as never, 'token');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
