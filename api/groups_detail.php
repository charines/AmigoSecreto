<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
$groupId = (int)($_GET['id'] ?? 0);
if ($groupId <= 0) {
    json_response(['ok' => false, 'error' => 'ID invalido'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, title, description, draw_date, budget_limit, status, created_at ' .
    'FROM `groups` WHERE id = ? AND admin_id = ? LIMIT 1'
);
$stmt->execute([$groupId, (int)$admin['id']]);
$group = $stmt->fetch();
if (!$group) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado'], 404);
}

$stmt = $pdo->prepare(
    'SELECT id, name, email, status, invite_sent_at, invite_clicked_at, confirmed_at, token_sent_at, revealed_at, created_at ' .
    'FROM participants WHERE group_id = ? ORDER BY created_at ASC'
);
$stmt->execute([$groupId]);
$participants = $stmt->fetchAll();

json_response([
    'ok' => true,
    'group' => $group,
    'participants' => $participants,
]);
