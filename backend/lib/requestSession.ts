import type { VercelRequest } from '@vercel/node';

export function readSessionToken(req: VercelRequest): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const match = cookieHeader.split(';').find((part) => part.trim().startsWith('session='));
  if (!match) return undefined;

  return decodeURIComponent(match.trim().slice('session='.length));
}
