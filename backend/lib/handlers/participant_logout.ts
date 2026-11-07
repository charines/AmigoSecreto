import type { Pool } from 'mysql2/promise';
import { destroyParticipantSession } from '../participantSessionStore.js';

export type LogoutResult = {
  status: number;
  body: { ok: boolean };
};

export async function logoutParticipant(pool: Pool, sessionToken: string | undefined): Promise<LogoutResult> {
  if (sessionToken) {
    await destroyParticipantSession(pool, sessionToken);
  }
  return { status: 200, body: { ok: true } };
}
