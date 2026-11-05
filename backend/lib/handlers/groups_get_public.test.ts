import { describe, expect, it, vi } from 'vitest';
import { getPublicGroup } from './groups_get_public.js';

describe('getPublicGroup', () => {
  it('rejects empty code', async () => {
    const pool = { query: vi.fn() };

    const result = await getPublicGroup(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Codigo ausente' } });
  });

  it('returns 404 when the code does not match any group', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getPublicGroup(pool as never, 'UNKNOWN');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('rejects when the group is not open', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, title: 'Natal', status: 'drawn' }]]) };

    const result = await getPublicGroup(pool as never, 'ABC123');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Este grupo ja encerrou as inscricoes' } });
  });

  it('returns the group when open', async () => {
    const group = { id: 1, title: 'Natal', description: '', draw_date: null, budget_limit: null, status: 'open' };
    const pool = { query: vi.fn().mockResolvedValue([[group]]) };

    const result = await getPublicGroup(pool as never, 'ABC123');

    expect(result).toEqual({ status: 200, body: { ok: true, group } });
  });
});
