import { describe, expect, it, vi } from 'vitest';
import { resetPassword } from './admin_reset_password.js';

describe('resetPassword', () => {
  it('rejects empty token', async () => {
    const pool = { query: vi.fn() };

    const result = await resetPassword(pool as never, '', '123456');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido ou expirado' } });
  });

  it('rejects short password', async () => {
    const pool = { query: vi.fn() };

    const result = await resetPassword(pool as never, 'some-token', '123');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Senha deve ter no minimo 6 caracteres' } });
  });

  it('rejects when token is invalid or expired', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };

    const result = await resetPassword(pool as never, 'expired-token', '123456');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Token invalido ou expirado' } });
  });

  it('updates the password and clears the reset token on success', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42 }]])
        .mockResolvedValueOnce([{}]),
    };

    const result = await resetPassword(pool as never, 'valid-token', '123456');

    expect(result).toEqual({ status: 200, body: { ok: true, message: 'Senha redefinida com sucesso.' } });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});
