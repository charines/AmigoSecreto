<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$code = trim((string)($_GET['code'] ?? ''));
if ($code === '') {
    json_response(['ok' => false, 'error' => 'Codigo ausente'], 400);
}

$pdo = db();
$stmt = $pdo->prepare(
    'SELECT id, title, description, draw_date, budget_limit, status ' .
    'FROM `groups` WHERE dharma_code = ? LIMIT 1'
);
$stmt->execute([$code]);
$group = $stmt->fetch();

if (!$group) {
    json_response(['ok' => false, 'error' => 'Grupo nao encontrado'], 404);
}

if ($group['status'] !== 'open') {
    json_response(['ok' => false, 'error' => 'Este grupo ja encerrou as inscricoes'], 400);
}

json_response([
    'ok' => true,
    'group' => $group,
]);
