import type { Pool } from 'mysql2/promise';

export async function migrateV5(pool: Pool): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE \`admins\`
      ADD COLUMN \`reset_token_hash\` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER \`password_hash\`,
      ADD COLUMN \`reset_expires\` datetime DEFAULT NULL AFTER \`reset_token_hash\`
    `);
    console.log('Colunas reset_token_hash e reset_expires adicionadas com sucesso.');
  } catch (err) {
    console.log('Aviso (colunas reset):', err instanceof Error ? err.message : err);
  }

  try {
    await pool.query('ALTER TABLE `admins` ADD UNIQUE KEY `uniq_admins_reset_token_hash` (`reset_token_hash`)');
    console.log('Indice unico em reset_token_hash adicionado com sucesso.');
  } catch (err) {
    console.log('Aviso (indice reset_token_hash):', err instanceof Error ? err.message : err);
  }

  console.log('Migracao V5 concluida.');
}
