import { describe, expect, it, vi } from 'vitest';
import { resendInvite } from './participants_resend_invite.js';

describe('resendInvite', () => {
  it('rejects an invalid participant id', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await resendInvite(pool as never, sendMail, 7, 0, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Participante invalido' } });
  });

  it('rejects when participant does not belong to the admin', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await resendInvite(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result).toEqual({ status: 404, body: { ok: false, error: 'Participante nao encontrado ou sem permissao' } });
  });

  it('rejects when the participant already received the draw token', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [{ id: 10, status: 'token_sent', invite_token: 'tok', email: 'a@x.com', group_title: 'Natal', group_description: '' }],
      ]),
    };
    const sendMail = vi.fn();

    const result = await resendInvite(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('resends the invite email and updates invite_sent_at', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([
          [{ id: 10, status: 'invited', invite_token: 'tok', email: 'a@x.com', group_title: 'Natal', group_description: '' }],
        ])
        .mockResolvedValueOnce([{}]),
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await resendInvite(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(sendMail).toHaveBeenCalledOnce();
    const message = sendMail.mock.calls[0][0];
    expect(message.subject).toContain('(Reenvio)');
  });
});
