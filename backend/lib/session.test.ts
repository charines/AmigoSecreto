import { describe, expect, it } from 'vitest';
import { buildSessionCookieOptions } from './session.js';

describe('buildSessionCookieOptions', () => {
  it('builds secure, httpOnly cookie options from session config', () => {
    const options = buildSessionCookieOptions({ samesite: 'None', secure: true });

    expect(options).toEqual({
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
  });

  it('respects secure: false for local development', () => {
    const options = buildSessionCookieOptions({ samesite: 'Lax', secure: false });

    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe('Lax');
  });
});
