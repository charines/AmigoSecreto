import { describe, expect, it } from 'vitest';
import { checkHealth } from './ping_check.js';

describe('checkHealth', () => {
  it('reports ok when the database responds', async () => {
    const fakePool = { query: async () => [[{ 1: 1 }], []] };

    const result = await checkHealth(fakePool as never);

    expect(result).toEqual({ ok: true, server: true, db: true });
  });

  it('reports db failure without throwing when the query fails', async () => {
    const fakePool = {
      query: async () => {
        throw new Error('connection refused');
      },
    };

    const result = await checkHealth(fakePool as never);

    expect(result).toEqual({ ok: false, server: true, db: false, db_error: 'Banco indisponivel' });
  });
});
