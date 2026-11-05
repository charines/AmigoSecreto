import { describe, expect, it, vi } from 'vitest';
import { listGroups } from './groups_list.js';

describe('listGroups', () => {
  it('returns the groups belonging to the admin, with participant counts', async () => {
    const rows = [{ id: 1, title: 'Natal', total_participants: 3, confirmed_count: 2 }];
    const pool = { query: vi.fn().mockResolvedValue([rows]) };

    const result = await listGroups(pool as never, 7);

    expect(result).toEqual({ status: 200, body: { ok: true, groups: rows } });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE g.admin_id = ?'), [7]);
  });
});
