import { describe, expect, it, vi } from 'vitest';
import { getInvite } from './invite.js';

describe('getInvite', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await getInvite(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido' } });
  });

  it('returns 404 when the token does not match any invite', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getInvite(pool as never, 'unknown-token');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Convite nao encontrado' } });
  });

  it('rejects when the group was cancelled', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValue([[{ id: 1, name: 'Ana', email: 'a@x.com', status: 'invited', title: 'Natal', description: '', group_status: 'cancelled' }]]),
    };

    const result = await getInvite(pool as never, 'token');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo cancelado' } });
  });

  it('marks status as link_clicked on first view and returns invite data', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([
          [{ id: 1, name: 'Ana', email: 'a@x.com', status: 'invited', title: 'Natal', description: 'desc', group_status: 'open' }],
        ])
        .mockResolvedValueOnce([{}]),
    };

    const result = await getInvite(pool as never, 'token');

    expect(result.status).toBe(200);
    expect(result.body.participant?.status).toBe('link_clicked');
    expect(result.body.group).toEqual({ title: 'Natal', description: 'desc', status: 'open' });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('does not touch status when already past invited', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [{ id: 1, name: 'Ana', email: 'a@x.com', status: 'confirmed', title: 'Natal', description: '', group_status: 'open' }],
      ]),
    };

    const result = await getInvite(pool as never, 'token');

    expect(result.body.participant?.status).toBe('confirmed');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
