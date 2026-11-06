import { describe, expect, it, vi } from 'vitest';
import { forgotPassword } from './admin_forgot_password.js';

describe('forgotPassword', () => {
  it('rejects invalid email', async () => {
    const pool = { query: vi.fn() };
    const sendMail = vi.fn();

    const result = await forgotPassword(pool as never, sendMail, 'not-an-email', 'https://app.example.com');

    expect(result).toEqual({ status: 400, body: { ok: false, error: 'Email invalido' } });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns the same success message even when the email does not exist (anti-enumeration)', async () => {
    const pool = { query: vi.fn().mockResolvedValue([[]]) };
    const sendMail = vi.fn();

    const result = await forgotPassword(pool as never, sendMail, 'nope@example.com', 'https://app.example.com');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('stores a reset token and sends an email when the admin exists', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42, name: 'Charles' }]])
        .mockResolvedValueOnce([{}]),
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    const result = await forgotPassword(pool as never, sendMail, 'charles@example.com', 'https://app.example.com');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(sendMail).toHaveBeenCalledOnce();
    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('charles@example.com');
    expect(message.text).toContain('https://app.example.com/reset-password?token=');
    expect(message.html).toBeTruthy();
    expect(message.html).toContain('href="https://app.example.com/reset-password?token=');
  });

  it('escapes HTML-sensitive characters from the admin name', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42, name: '<script>alert(1)</script>' }]])
        .mockResolvedValueOnce([{}]),
    };
    const sendMail = vi.fn().mockResolvedValue(undefined);

    await forgotPassword(pool as never, sendMail, 'charles@example.com', 'https://app.example.com');

    const message = sendMail.mock.calls[0][0];
    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;script&gt;');
  });

  it('still returns success when sendMail throws (never exposes SMTP failure)', async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[{ id: 42, name: 'Charles' }]])
        .mockResolvedValueOnce([{}]),
    };
    const sendMail = vi.fn().mockRejectedValue(new Error('smtp down'));

    const result = await forgotPassword(pool as never, sendMail, 'charles@example.com', 'https://app.example.com');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });
});
