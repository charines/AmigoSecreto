<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$pdo = db();

try {
    // Add dharma_code to groups
    $stmt = $pdo->query('SHOW COLUMNS FROM `groups` LIKE "dharma_code"');
    if (!$stmt->fetch()) {
        $pdo->exec('ALTER TABLE `groups` ADD COLUMN `dharma_code` VARCHAR(32) NULL UNIQUE AFTER `status`');
        echo "Column dharma_code added to groups\n";
        
        // Populate existing groups with codes
        $groups = $pdo->query('SELECT id FROM `groups` WHERE dharma_code IS NULL')->fetchAll();
        $stmtUpdate = $pdo->prepare('UPDATE `groups` SET dharma_code = ? WHERE id = ?');
        foreach ($groups as $g) {
            $stmtUpdate->execute([strtoupper(random_token(6)), $g['id']]);
        }
        echo "Populated " . count($groups) . " groups with codes\n";
    }
    else {
        echo "Column dharma_code already exists\n";
    }
}
catch (Exception $e) {
    die("Migration failed: " . $e->getMessage());
}
