<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
$input = json_input();

$groupId = (int)($input['group_id'] ?? 0);

if ($groupId <= 0) {
    json_response(['ok' => false, 'error' => 'Grupo invalido'], 400);
}

$pdo = db();

// Verify ownership
$stmt = $pdo->prepare('SELECT id FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1');
$stmt->execute([$groupId, (int)$admin['id']]);
if (!$stmt->fetch()) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado ou sem permissao'], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM `groups` WHERE id = ?');
    $stmt->execute([$groupId]);
    json_response(['ok' => true]);
}
catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'Erro ao deletar grupo: ' . $e->getMessage()], 500);
}