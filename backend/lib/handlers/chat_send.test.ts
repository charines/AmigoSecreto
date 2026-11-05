import { describe, expect, it, vi } from 'vitest';
import { sendChatMessage } from './chat_send.js';

describe('sendChatMessage', () => {
  it('rejects missing fields', async () => {
    const pool = { query: vi.fn() };

    const result = await sendChatMessage(pool as never, { token: '', channel: '', texto: '' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Dados invalidos' } });
  });

  it('rejects an invalid channel', async () => {
    const pool = { query: vi.fn() };

    const result = await sendChatMessage(pool as never, { token: 'tok', channel: 'outro', texto: 'oi' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Canal invalido' } });
  });

  it('returns 404 when the participant is not found', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await sendChatMessage(pool as never, { token: 'tok', channel: 'amigo', texto: 'oi' });

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Participante nao encontrado' } });
  });

  it('returns 404 when no draw exists for the amigo channel (giver)', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, group_id: 9 }]]) // participant
        .mockResolvedValueOnce([[]]), // no draw as giver
    };

    const result = await sendChatMessage(pool as never, { token: 'tok', channel: 'amigo', texto: 'oi' });

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Sorteio nao encontrado' } });
  });

  it('inserts the message and returns it formatted as "Você"', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, group_id: 9 }]]) // participant
        .mockResolvedValueOnce([[{ id: 100 }]]) // draw as giver
        .mockResolvedValueOnce([{ insertId: 55 }]) // insert message
        .mockResolvedValueOnce([[{ created_at: '2026-12-24 10:00:00' }]]), // select created_at
    };

    const result = await sendChatMessage(pool as never, { token: 'tok', channel: 'amigo', texto: 'Oi!' });

    expect(result.status).toBe(200);
    expect(result.body.message).toMatchObject({ id: 55, role: 'Você', texto: 'Oi!' });
  });
});
