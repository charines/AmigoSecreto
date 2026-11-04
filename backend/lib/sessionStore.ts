import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { randomToken } from './session.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export async function createSession(pool: Pool, adminId: number): Promise<string> {
  const rawToken = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString().slice(0, 19).replace('T', ' ');

  await pool.query('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)', [
    hashToken(rawToken),
    adminId,
    expiresAt,
  ]);

  return rawToken;
}

export async function resolveSession(pool: Pool, rawToken: string): Promise<number | null> {
  type SessionRow = RowDataPacket & { admin_id: number };
  const [rows] = await pool.query<SessionRow[]>(
    'SELECT admin_id FROM sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [hashToken(rawToken)],
  );
  const row = rows[0];
  return row ? row.admin_id : null;
}

export async function destroySession(pool: Pool, rawToken: string): Promise<void> {
  await pool.query('DELETE FROM sessions WHERE token_hash = ?', [hashToken(rawToken)]);
}
