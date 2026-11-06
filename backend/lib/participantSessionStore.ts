import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { randomToken } from './session.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function createParticipantSession(pool: Pool, participantAccountId: number): Promise<string> {
  const rawToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString().slice(0, 19).replace('T', ' ');

  await pool.query(
    'INSERT INTO participant_sessions (token_hash, participant_account_id, expires_at) VALUES (?, ?, ?)',
    [hashToken(rawToken), participantAccountId, expiresAt],
  );

  return rawToken;
}

export async function resolveParticipantSession(pool: Pool, rawToken: string): Promise<number | null> {
  type SessionRow = RowDataPacket & { participant_account_id: number };
  const [rows] = await pool.query<SessionRow[]>(
    'SELECT participant_account_id FROM participant_sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [hashToken(rawToken)],
  );
  const row = rows[0];
  return row ? row.participant_account_id : null;
}

export async function destroyParticipantSession(pool: Pool, rawToken: string): Promise<void> {
  await pool.query('DELETE FROM participant_sessions WHERE token_hash = ?', [hashToken(rawToken)]);
}
