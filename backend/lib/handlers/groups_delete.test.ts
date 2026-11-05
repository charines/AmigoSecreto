import { describe, expect, it, vi } from 'vitest';
import { deleteGroup } from './groups_delete.js';

describe('deleteGroup', () => {
  it('rejects an invalid group id', async () => {
    const pool = { query: vi.fn() };

    const result = await deleteGroup(pool as never, 7, 0);

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo invalido' } });
  });

  it('rejects when the group does not belong to the admin', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await deleteGroup(pool as never, 7, 99);

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado ou sem permissao' } });
  });

  it('deletes the group when owned by the admin', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 99 }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await deleteGroup(pool as never, 7, 99);

    expect(result).toEqual({ status: 200, body: { ok: true } });
  });
});
