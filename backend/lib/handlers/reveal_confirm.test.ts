import { describe, expect, it, vi } from 'vitest';
import { confirmReveal } from './reveal_confirm.js';

describe('confirmReveal', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await confirmReveal(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido' } });
  });

  it('returns 404 for unknown token', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await confirmReveal(pool as never, 'unknown');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Registro nao encontrado' } });
  });

  it('marks status as revealed when not already', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, status: 'token_sent' }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await confirmReveal(pool as never, 'token');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('is idempotent when already revealed', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, status: 'revealed' }]]) };

    const result = await confirmReveal(pool as never, 'token');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
