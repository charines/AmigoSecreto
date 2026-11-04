import { describe, expect, it, vi } from 'vitest';
import { resendDraw } from './participants_resend_draw.js';

describe('resendDraw', () => {
  it('rejects an invalid participant id', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await resendDraw(pool as never, sendMail, 7, 0, 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Participante invalido' } });
  });

  it('returns 404 when not found, not owned, or draw not done yet', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await resendDraw(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result.status).toBe(404);
  });

  it('rejects when the raw token was not stored', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue([
        [{ id: 10, reveal_token: 'rt', token_raw: null, name: 'Ana', email: 'a@x.com', group_title: 'Natal', group_description: '', group_draw_date: null }],
      ]),
    };
    const sendMail = vi.fn();

    const result = await resendDraw(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('resends the draw email and updates token_sent_at', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([
          [
            {
              id: 10,
              reveal_token: 'rt',
              token_raw: 'raw-code',
              name: 'Ana',
              email: 'a@x.com',
              group_title: 'Natal',
              group_description: '',
              group_draw_date: null,
            },
          ],
        ])
        .mockResolvedValueOnce([{}]),
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await resendDraw(pool as never, sendMail, 7, 10, 'https://app.example.com');

    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(sendMail).toHaveBeenCalledOnce();
    const message = sendMail.mock.calls[0][0];
    expect(message.text).toContain('raw-code');
    expect(message.text).toContain('token=rt');
  });
});
