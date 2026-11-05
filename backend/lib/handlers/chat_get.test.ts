import { describe, expect, it, vi } from 'vitest';
import { getChatMessages } from './chat_get.js';

describe('getChatMessages', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await getChatMessages(pool as never, '');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido' } });
  });

  it('returns 404 when the participant does not exist', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await getChatMessages(pool as never, 'unknown');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Participante nao encontrado' } });
  });

  it('returns both channels, empty when no draw exists for that role', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, group_id: 9 }]]) // participant lookup
        .mockResolvedValueOnce([[]]) // no draw as giver
        .mockResolvedValueOnce([[]]), // no draw as receiver
    };

    const result = await getChatMessages(pool as never, 'token');

    expect(result.status).toBe(200);
    expect(result.body.messages?.amigo).toHaveLength(1); // system message only
    expect(result.body.messages?.admirador).toHaveLength(1);
  });

  it('includes stored messages for both channels when draws exist', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, group_id: 9 }]]) // participant
        .mockResolvedValueOnce([[{ id: 100 }]]) // draw as giver
        .mockResolvedValueOnce([[{ id: 1, sender_role: 'giver', texto: 'oi', created_at: '2026-12-24 10:00:00' }]]) // amigo msgs
        .mockResolvedValueOnce([[{ id: 200 }]]) // draw as receiver
        .mockResolvedValueOnce([[{ id: 2, sender_role: 'giver', texto: 'ola', created_at: '2026-12-24 10:05:00' }]]), // admirador msgs
    };

    const result = await getChatMessages(pool as never, 'token');

    expect(result.body.messages?.amigo).toHaveLength(2);
    expect(result.body.messages?.admirador).toHaveLength(2);
  });
});
