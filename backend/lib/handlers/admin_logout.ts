import type { Pool } from 'mysql2/promise';
import { destroySession } from '../sessionStore.js';

export type LogoutResult = {
  status: number;
  body: { ok: boolean };
};

export async function logoutAdmin(pool: Pool, sessionToken: string | undefined): Promise<LogoutResult> {
  if (sessionToken) {
    await destroySession(pool, sessionToken);
  }
  return { status: 200, body: { ok: true } };
}
