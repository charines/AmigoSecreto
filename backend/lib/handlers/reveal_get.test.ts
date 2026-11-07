import { describe, expect, it, vi } from 'vitest';
import { getReveal } from './reveal_get.js';

describe('getReveal', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await getReveal(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido' } });
  });

  it('returns 404 when the token does not match', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getReveal(pool as never, 'unknown');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Link invalido' } });
  });

  it('rejects when the draw has not happened yet', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            name: 'Ana',
            status: 'confirmed',
            title: 'Natal',
            group_status: 'open',
            encrypted_payload: 'abc',
            iv_b64: 'def',
          },
        ],
      ]),
    };

    const result = await getReveal(pool as never, 'token');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Sorteio ainda nao foi concluido' } });
  });

  it('returns the giver, group and encrypted payload when the draw is done', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [
          {
            id: 1,
            name: 'Ana',
            status: 'token_sent',
            title: 'Natal',
            group_status: 'drawn',
            encrypted_payload: 'abc',
            iv_b64: 'def',
          },
        ],
      ]),
    };

    const result = await getReveal(pool as never, 'token');

    expect(result).toEqual({
      status: 200,
      body: {
        ok: true,
        giver: { id: 1, name: 'Ana', status: 'token_sent' },
        group: { title: 'Natal', status: 'drawn' },
        payload: { encrypted: 'abc', iv_b64: 'def' },
      },
    });
  });
});
