import { describe, expect, it, vi } from 'vitest';
import { listParticipantGroups } from './participant_groups_list.js';

describe('listParticipantGroups', () => {
  it('returns every group linked to the account email', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [
          { id: 1, title: 'Natal 2026', status: 'open', draw_date: null, dharma_code: 'ABC123' },
          { id: 2, title: 'Amigos do trampo', status: 'drawn', draw_date: null, dharma_code: 'XYZ789' },
        ],
      ]),
    };

    const result = await listParticipantGroups(pool as never, 'p@example.com');

    expect(result).toEqual({
      status: 200,
      body: {
        ok: true,
        groups: [
          { id: 1, title: 'Natal 2026', status: 'open', draw_date: null, dharma_code: 'ABC123' },
          { id: 2, title: 'Amigos do trampo', status: 'drawn', draw_date: null, dharma_code: 'XYZ789' },
        ],
      },
    });
  });

  it('returns an empty list when the email has no groups', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await listParticipantGroups(pool as never, 'nobody@example.com');

    expect(result).toEqual({ status: 200, body: { ok: true, groups: [] } });
  });
});
