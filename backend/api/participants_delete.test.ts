import { describe, expect, it, vi } from 'vitest';
import { deleteParticipant } from './participants_delete.js';

describe('deleteParticipant', () => {
  it('rejects an invalid id', async () => {
    const pool = { query: vi.fn() };

    const result = await deleteParticipant(pool as never, 7, 0);

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Participante invalido' } });
  });

  it('rejects when participant does not belong to the admin', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await deleteParticipant(pool as never, 7, 10);

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Participante nao encontrado ou sem permissao' } });
  });

  it('deletes the participant without resetting the group when it is still open', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 10, group_id: 1, group_status: 'open' }]])
        .mockResolvedValueOnce([{}]), // delete participant
    };

    const result = await deleteParticipant(pool as never, 7, 10);

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('resets the draw and group status when the group was already drawn', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 10, group_id: 1, group_status: 'drawn' }]])
        .mockResolvedValueOnce([{}]) // delete draw_results
        .mockResolvedValueOnce([{}]) // reset participants
        .mockResolvedValueOnce([{}]) // group back to open
        .mockResolvedValueOnce([{}]), // delete participant
    };

    const result = await deleteParticipant(pool as never, 7, 10);

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(pool.query).toHaveBeenNthCalledWith(2, expect.stringContaining('DELETE FROM draw_results'), [1]);
    expect(pool.query).toHaveBeenNthCalledWith(4, expect.stringContaining("SET status = 'open'"), [1]);
  });
});
