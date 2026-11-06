import { describe, expect, it, vi } from 'vitest';
import { inviteParticipants } from './groups_invite.js';

describe('inviteParticipants', () => {
  it('rejects when group id or participants list is invalid', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 0,
      participants: [],
      baseUrl: 'https://app.example.com',
    });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Dados invalidos' } });
  });

  it('rejects when the group is not found', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 1,
      participants: [{ name: 'Ana', email: 'ana@example.com' }],
      baseUrl: 'https://app.example.com',
    });

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('rejects when the group is not open', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, title: 'Natal', status: 'drawn' }]]) };
    const sendMail = vi.fn();

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 1,
      participants: [{ name: 'Ana', email: 'ana@example.com' }],
      baseUrl: 'https://app.example.com',
    });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Grupo nao esta aberto' } });
  });

  it('rejects an invalid participant before inserting anything', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([[{ id: 1, title: 'Natal', description: '', status: 'open' }]]),
    };
    const sendMail = vi.fn();

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 1,
      participants: [{ name: '', email: 'not-an-email' }],
      baseUrl: 'https://app.example.com',
    });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Participante invalido' } });
    expect(pool.query).toHaveBeenCalledTimes(1); // only the group lookup
  });

  it('creates participants and reports sent/failed emails', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', description: '', status: 'open' }]]) // group lookup
        .mockResolvedValueOnce([{ insertId: 50 }]) // insert Ana
        .mockResolvedValueOnce([{}]) // update invite_sent_at Ana
        .mockResolvedValueOnce([{ insertId: 51 }]) // insert Bob
        .mockResolvedValueOnce([{}]), // update invite_sent_at Bob
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 1,
      participants: [
        { name: 'Ana', email: 'ana@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
      ],
      baseUrl: 'https://app.example.com',
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.sent).toEqual(['ana@example.com', 'bob@example.com']);
    expect(result.body.failed).toEqual([]);
    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(sendMail.mock.calls[0][0].html).toBeTruthy();
    expect(sendMail.mock.calls[1][0].html).toBeTruthy();
  });

  it('reports a failed send without blocking the others', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', description: '', status: 'open' }]])
        .mockResolvedValueOnce([{ insertId: 50 }]),
    };
    const sendMail = vi.fn().mockRejectedValue(new Error('smtp down'));

    const result = await inviteParticipants(pool as never, sendMail, 7, {
      group_id: 1,
      participants: [{ name: 'Ana', email: 'ana@example.com' }],
      baseUrl: 'https://app.example.com',
    });

    expect(result.body.sent).toEqual([]);
    expect(result.body.failed).toEqual([{ email: 'ana@example.com', error: 'smtp down' }]);
  });
});
