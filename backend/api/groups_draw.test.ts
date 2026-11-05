import { describe, expect, it, vi } from 'vitest';
import { runDraw } from './groups_draw.js';

describe('runDraw', () => {
  it('rejects an invalid group id', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await runDraw(pool as never, sendMail, 7, 0, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo invalido' } });
  });

  it('rejects when the group is not found', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await runDraw(pool as never, sendMail, 7, 1, 'https://app.example.com');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('rejects when the group is not open', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, title: 'Natal', status: 'drawn' }]]) };
    const sendMail = vi.fn();

    const result = await runDraw(pool as never, sendMail, 7, 1, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo nao esta aberto' } });
  });

  it('rejects fewer than 2 confirmed participants', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', status: 'open' }]])
        .mockResolvedValueOnce([[{ id: 10, name: 'Ana', email: 'a@x.com' }]]),
    };
    const sendMail = vi.fn();

    const result = await runDraw(pool as never, sendMail, 7, 1, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Minimo de 2 participantes confirmados' } });
  });

  it('runs the draw, stores encrypted results, marks the group as drawn, and sends emails', async () => {
    const participants = [
      { id: 10, name: 'Ana', email: 'a@x.com' },
      { id: 11, name: 'Bob', email: 'b@x.com' },
    ];
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', description: '', draw_date: null, status: 'open' }]]) // group lookup
        .mockResolvedValueOnce([participants]) // confirmed participants
        .mockResolvedValueOnce([{}]) // insert draw_results for giver 1
        .mockResolvedValueOnce([{}]) // update reveal_token for giver 1
        .mockResolvedValueOnce([{}]) // insert draw_results for giver 2
        .mockResolvedValueOnce([{}]) // update reveal_token for giver 2
        .mockResolvedValueOnce([{}]) // group status -> drawn
        .mockResolvedValueOnce([{}]) // participant token_sent giver 1
        .mockResolvedValueOnce([{}]), // participant token_sent giver 2
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await runDraw(pool as never, sendMail, 7, 1, 'https://app.example.com');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.sent).toHaveLength(2);
    expect(result.body.failed).toEqual([]);
    expect(sendMail).toHaveBeenCalledTimes(2);

    const insertDrawCall = pool.query.mock.calls[2];
    expect(insertDrawCall[0]).toContain('INSERT INTO draw_results');
    const statusUpdateCall = pool.query.mock.calls[6];
    expect(statusUpdateCall[0]).toContain("UPDATE `groups` SET status = 'drawn'");
  });
});
