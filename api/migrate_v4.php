<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$pdo = db();

try {
    $pdo->exec(
        "ALTER TABLE `draw_results` ADD COLUMN `receiver_id` bigint UNSIGNED NULL AFTER `giver_id`;"
    );
    echo "Coluna receiver_id adicionada com sucesso.\n";
} catch (Throwable $e) {
    echo "Aviso (receiver_id): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec(
        "ALTER TABLE `draw_results` ADD CONSTRAINT `fk_draw_receiver_id` FOREIGN KEY (`receiver_id`) REFERENCES `participants` (`id`) ON DELETE CASCADE;"
    );
    echo "FK receiver_id adicionada com sucesso.\n";
} catch (Throwable $e) {
    echo "Aviso (fk_receiver_id): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `chat_messages` (
          `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
          `group_id` bigint UNSIGNED NOT NULL,
          `draw_id` bigint UNSIGNED NOT NULL,
          `sender_role` enum('giver','receiver') COLLATE utf8mb4_unicode_ci NOT NULL,
          `texto` text COLLATE utf8mb4_unicode_ci NOT NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_chat_group_id` (`group_id`),
          KEY `idx_chat_draw_id` (`draw_id`),
          CONSTRAINT `fk_chat_group_id` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
          CONSTRAINT `fk_chat_draw_id` FOREIGN KEY (`draw_id`) REFERENCES `draw_results` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    );
    echo "Tabela chat_messages criada com sucesso.\n";
} catch (Throwable $e) {
    echo "Erro (chat_messages): " . $e->getMessage() . "\n";
}

echo "Migracao V4 concluida.\n";
