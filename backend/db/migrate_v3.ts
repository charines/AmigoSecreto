import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { randomToken } from '../lib/session.js';

export async function migrateV3(pool: Pool): Promise<void> {
  const [cols] = await pool.query<RowDataPacket[]>('SHOW COLUMNS FROM `groups` LIKE "dharma_code"');
  if (cols.length > 0) {
    console.log('Column dharma_code already exists');
    return;
  }

  await pool.query('ALTER TABLE `groups` ADD COLUMN `dharma_code` VARCHAR(32) NULL UNIQUE AFTER `status`');
  console.log('Column dharma_code added to groups');

  const [groups] = await pool.query<RowDataPacket[]>('SELECT id FROM `groups` WHERE dharma_code IS NULL');
  for (const group of groups as Array<{ id: number }>) {
    const code = randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    await pool.query<ResultSetHeader>('UPDATE `groups` SET dharma_code = ? WHERE id = ?', [code, group.id]);
  }
  console.log(`Populated ${groups.length} groups with codes`);
}
