import type { Pool, RowDataPacket } from 'mysql2/promise';
import { resolveSession } from './sessionStore.js';

export type Admin = { id: number; name: string; email: string };

type AdminRow = RowDataPacket & Admin;

export async function requireAdmin(pool: Pool, sessionToken: string | undefined): Promise<Admin | null> {
  if (!sessionToken) return null;

  const adminId = await resolveSession(pool, sessionToken);
  if (!adminId) return null;

  const [rows] = await pool.query<AdminRow[]>('SELECT id, name, email FROM admins WHERE id = ? LIMIT 1', [adminId]);
  return rows[0] ?? null;
}
