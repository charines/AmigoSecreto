<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$pdo = db();

try {
    // Check if token_raw exists in draw_results
    $stmt = $pdo->query('SHOW COLUMNS FROM `draw_results` LIKE "token_raw"');
    if (!$stmt->fetch()) {
        $pdo->exec('ALTER TABLE `draw_results` ADD COLUMN `token_raw` VARCHAR(64) NULL AFTER `token_hash`');
        echo "Column token_raw added to draw_results\n";
    }
    else {
        echo "Column token_raw already exists\n";
    }
}
catch (Exception $e) {
    die("Migration failed: " . $e->getMessage());
}