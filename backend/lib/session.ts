import { randomBytes } from 'node:crypto';

export type SessionConfig = {
  samesite: string;
  secure: boolean;
};

export type SessionCookieOptions = {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
};

export function buildSessionCookieOptions(config: SessionConfig): SessionCookieOptions {
  return {
    path: '/',
    httpOnly: true,
    secure: config.secure,
    sameSite: config.samesite,
  };
}

export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString('base64url');
}
