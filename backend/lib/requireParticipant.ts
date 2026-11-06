import type { Pool, RowDataPacket } from 'mysql2/promise';
import { resolveParticipantSession } from './participantSessionStore.js';

export type ParticipantAccount = { id: number; email: string };

type ParticipantAccountRow = RowDataPacket & ParticipantAccount;

export async function requireParticipant(
  pool: Pool,
  sessionToken: string | undefined,
): Promise<ParticipantAccount | null> {
  if (!sessionToken) return null;

  const accountId = await resolveParticipantSession(pool, sessionToken);
  if (!accountId) return null;

  const [rows] = await pool.query<ParticipantAccountRow[]>(
    'SELECT id, email FROM participant_accounts WHERE id = ? LIMIT 1',
    [accountId],
  );
  return rows[0] ?? null;
}
