import { describe, expect, it, vi } from 'vitest';
import { createGroup } from './groups_create.js';

describe('createGroup', () => {
  it('rejects missing title', async () => {
    const pool = { query: vi.fn() };

    const result = await createGroup(pool as never, 7, { title: '', description: '', draw_date: '', budget_limit: '' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Titulo obrigatorio' } });
  });

  it('rejects an invalid draw date', async () => {
    const pool = { query: vi.fn() };

    const result = await createGroup(pool as never, 7, {
      title: 'Natal',
      description: '',
      draw_date: 'not a date',
      budget_limit: '',
    });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Data invalida' } });
  });

  it('rejects a non-numeric budget', async () => {
    const pool = { query: vi.fn() };

    const result = await createGroup(pool as never, 7, {
      title: 'Natal',
      description: '',
      draw_date: '',
      budget_limit: 'abc',
    });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Budget invalido' } });
  });

  it('creates the group with an open status and a dharma code', async () => {
    const pool = { query: vi.fn().mockResolvedValue([{ insertId: 10 }]) };

    const result = await createGroup(pool as never, 7, {
      title: 'Natal',
      description: 'Confraternizacao',
      draw_date: '2026-12-24T18:30',
      budget_limit: '50',
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.group).toMatchObject({
      id: 10,
      title: 'Natal',
      description: 'Confraternizacao',
      draw_date: '2026-12-24 18:30:00',
      budget_limit: 50,
      status: 'open',
    });
    expect(result.body.group?.dharma_code).toMatch(/^[A-Z0-9]+$/);
  });
});
