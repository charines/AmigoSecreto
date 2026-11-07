import type { Pool, RowDataPacket } from 'mysql2/promise';
import { resolveSession } from '../sessionStore.js';

export type MeResult = {
  status: number;
  body: { ok: boolean; error?: string; admin?: { id: number; name: string; email: string } };
};

type AdminRow = RowDataPacket & { id: number; name: string; email: string };

const UNAUTHORIZED: MeResult = { status: 401, body: { ok: false, error: 'Nao autorizado' } };

export async function getCurrentAdmin(pool: Pool, sessionToken: string | undefined): Promise<MeResult> {
  if (!sessionToken) return UNAUTHORIZED;

  const adminId = await resolveSession(pool, sessionToken);
  if (!adminId) return UNAUTHORIZED;

  const [rows] = await pool.query<AdminRow[]>('SELECT id, name, email FROM admins WHERE id = ? LIMIT 1', [adminId]);
  const admin = rows[0];
  if (!admin) return UNAUTHORIZED;

  return { status: 200, body: { ok: true, admin: { id: admin.id, name: admin.name, email: admin.email } } };
}
