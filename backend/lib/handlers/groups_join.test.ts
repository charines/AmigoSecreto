import { describe, expect, it, vi } from 'vitest';
import { joinGroup } from './groups_join.js';

describe('joinGroup', () => {
  it('rejects incomplete data', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await joinGroup(pool as never, sendMail, { code: '', name: '', email: '' }, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Dados incompletos' } });
  });

  it('rejects invalid email', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await joinGroup(
      pool as never,
      sendMail,
      { code: 'ABC', name: 'Ana', email: 'not-an-email' },
      'https://app.example.com',
    );

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'E-mail invalido' } });
  });

  it('returns 404 when the code does not match a group', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await joinGroup(
      pool as never,
      sendMail,
      { code: 'ABC', name: 'Ana', email: 'a@x.com' },
      'https://app.example.com',
    );

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Grupo nao encontrado' } });
  });

  it('rejects when the group is not open', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[{ id: 1, title: 'Natal', status: 'drawn' }]]) };
    const sendMail = vi.fn();

    const result = await joinGroup(
      pool as never,
      sendMail,
      { code: 'ABC', name: 'Ana', email: 'a@x.com' },
      'https://app.example.com',
    );

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Inscricoes encerradas para este grupo' } });
  });

  it('rejects when the email is already registered in the group', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', description: '', status: 'open' }]])
        .mockResolvedValueOnce([[{ id: 50 }]]),
    };
    const sendMail = vi.fn();

    const result = await joinGroup(
      pool as never,
      sendMail,
      { code: 'ABC', name: 'Ana', email: 'a@x.com' },
      'https://app.example.com',
    );

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Este e-mail ja esta registrado neste grupo' } });
  });

  it('registers the participant and sends the invite email', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, title: 'Natal', description: '', status: 'open' }]]) // group
        .mockResolvedValueOnce([[]]) // no existing email
        .mockResolvedValueOnce([{ insertId: 77 }]) // insert participant
        .mockResolvedValueOnce([{}]), // update invite_sent_at
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await joinGroup(
      pool as never,
      sendMail,
      { code: 'ABC', name: 'Ana', email: 'a@x.com' },
      'https://app.example.com',
    );

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(sendMail).toHaveBeenCalledOnce();
    expect(sendMail.mock.calls[0][0].text).toContain('token=');
    expect(sendMail.mock.calls[0][0].html).toBeTruthy();
  });
});
