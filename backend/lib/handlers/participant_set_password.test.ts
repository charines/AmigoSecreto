import { describe, expect, it, vi } from 'vitest';
import { setParticipantPassword } from './participant_set_password.js';

describe('setParticipantPassword', () => {
  it('rejects empty token or password', async () => {
    const pool = { query: vi.fn() };

    const result = await setParticipantPassword(pool as never, { token: '', password: '' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token e senha sao obrigatorios' } });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 6 characters', async () => {
    const pool = { query: vi.fn() };

    const result = await setParticipantPassword(pool as never, { token: 'tok', password: '123' });

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Senha muito curta' } });
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown invite token', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await setParticipantPassword(pool as never, { token: 'unknown', password: 'secret1' });

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Convite nao encontrado' } });
  });

  it('rejects when the participant has not confirmed yet', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([[{ id: 1, email: 'p@example.com', status: 'link_clicked' }]]),
    };

    const result = await setParticipantPassword(pool as never, { token: 'tok', password: 'secret1' });

    expect(result).toEqual({
      status: 400,
      body: { ok: false, error: 'Confirme sua participacao antes de criar uma senha' },
    });
  });

  it('upserts the participant account when confirmed', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 1, email: 'p@example.com', status: 'confirmed' }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await setParticipantPassword(pool as never, { token: 'tok', password: 'secret1' });

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO participant_accounts'),
      expect.arrayContaining(['p@example.com', expect.any(String)]),
    );
  });
});
