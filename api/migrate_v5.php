<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$pdo = db();

try {
    $pdo->exec(
        "ALTER TABLE `admins`
         ADD COLUMN `reset_token_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `password_hash`,
         ADD COLUMN `reset_expires`    datetime                                 DEFAULT NULL AFTER `reset_token_hash`;"
    );
    echo "Colunas reset_token_hash e reset_expires adicionadas com sucesso.\n";
} catch (Throwable $e) {
    echo "Aviso (colunas reset): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec(
        "ALTER TABLE `admins`
         ADD UNIQUE KEY `uniq_admins_reset_token_hash` (`reset_token_hash`);"
    );
    echo "Indice unico em reset_token_hash adicionado com sucesso.\n";
} catch (Throwable $e) {
    echo "Aviso (indice reset_token_hash): " . $e->getMessage() . "\n";
}

echo "Migracao V5 concluida.\n";
