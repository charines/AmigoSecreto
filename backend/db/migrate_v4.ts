import type { Pool } from 'mysql2/promise';

export async function migrateV4(pool: Pool): Promise<void> {
  try {
    await pool.query('ALTER TABLE `draw_results` ADD COLUMN `receiver_id` bigint UNSIGNED NULL AFTER `giver_id`');
    console.log('Coluna receiver_id adicionada com sucesso.');
  } catch (err) {
    console.log('Aviso (receiver_id):', err instanceof Error ? err.message : err);
  }

  try {
    await pool.query(
      'ALTER TABLE `draw_results` ADD CONSTRAINT `fk_draw_receiver_id` FOREIGN KEY (`receiver_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE',
    );
    console.log('FK receiver_id adicionada com sucesso.');
  } catch (err) {
    console.log('Aviso (fk_receiver_id):', err instanceof Error ? err.message : err);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`chat_messages\` (
        \`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
        \`group_id\` bigint UNSIGNED NOT NULL,
        \`draw_id\` bigint UNSIGNED NOT NULL,
        \`sender_role\` enum('giver','receiver') COLLATE utf8mb4_unicode_ci NOT NULL,
        \`texto\` text COLLATE utf8mb4_unicode_ci NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_chat_group_id\` (\`group_id\`),
        KEY \`idx_chat_draw_id\` (\`draw_id\`),
        CONSTRAINT \`fk_chat_group_id\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_chat_draw_id\` FOREIGN KEY (\`draw_id\`) REFERENCES \`draw_results\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Tabela chat_messages criada com sucesso.');
  } catch (err) {
    console.log('Erro (chat_messages):', err instanceof Error ? err.message : err);
  }

  console.log('Migracao V4 concluida.');
}
