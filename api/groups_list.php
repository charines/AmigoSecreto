<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
$pdo = db();

$stmt = $pdo->prepare(
    'SELECT g.id, g.title, g.description, g.draw_date, g.budget_limit, g.status, g.dharma_code, g.created_at, ' .
    '(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id) AS total_participants, ' .
    "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'confirmed') AS confirmed_count, " .
    "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'token_sent') AS token_sent_count, " .
    "(SELECT COUNT(*) FROM participants p WHERE p.group_id = g.id AND p.status = 'revealed') AS revealed_count " .
    'FROM `groups` g WHERE g.admin_id = ? ORDER BY g.created_at DESC'
);
$stmt->execute([(int)$admin['id']]);
$groups = $stmt->fetchAll();

json_response(['ok' => true, 'groups' => $groups]);
