import { describe, expect, it } from 'vitest';
import { summarizeInviteResult } from './inviteResult.js';

describe('summarizeInviteResult', () => {
  it('reports success when every invite was sent', () => {
    const result = summarizeInviteResult({ ok: true, sent: ['a@x.com', 'b@x.com'], failed: [] });

    expect(result.allFailed).toBe(false);
    expect(result.error).toBe('');
    expect(result.notice).toMatch(/notificados/i);
  });

  it('lists failed emails and keeps the success notice on partial failure', () => {
    const result = summarizeInviteResult({
      ok: true,
      sent: ['a@x.com'],
      failed: [{ email: 'b@x.com', error: 'SMTP timeout' }],
    });

    expect(result.allFailed).toBe(false);
    expect(result.notice).toMatch(/notificados/i);
    expect(result.error).toContain('b@x.com');
    expect(result.error).toMatch(/reenviar convite/i);
    expect(result.error).not.toContain('SMTP timeout');
  });

  it('flags allFailed and gives no success notice when nothing was sent', () => {
    const result = summarizeInviteResult({
      ok: true,
      sent: [],
      failed: [{ email: 'a@x.com', error: 'x' }, { email: 'b@x.com', error: 'y' }],
    });

    expect(result.allFailed).toBe(true);
    expect(result.notice).toBe('');
    expect(result.error).toContain('a@x.com');
    expect(result.error).toContain('b@x.com');
  });

  it('treats a response without sent/failed arrays as success', () => {
    const result = summarizeInviteResult({ ok: true });

    expect(result.allFailed).toBe(false);
    expect(result.error).toBe('');
  });
});
