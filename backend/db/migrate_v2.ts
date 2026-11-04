import type { Pool, RowDataPacket } from 'mysql2/promise';

export async function migrateV2(pool: Pool): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>('SHOW COLUMNS FROM `draw_results` LIKE "token_raw"');
  if (rows.length > 0) {
    console.log('Column token_raw already exists');
    return;
  }

  await pool.query('ALTER TABLE `draw_results` ADD COLUMN `token_raw` VARCHAR(64) NULL AFTER `token_hash`');
  console.log('Column token_raw added to draw_results');
}
