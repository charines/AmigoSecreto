<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
$input = json_input();

$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$drawDateRaw = trim((string)($input['draw_date'] ?? ''));
$budgetRaw = trim((string)($input['budget_limit'] ?? ''));

if ($title === '') {
    json_response(['ok' => false, 'error' => 'Titulo obrigatorio'], 400);
}

function parse_draw_date(string $raw): ?string
{
    $raw = trim($raw);
    if ($raw === '') {
        return null;
    }

    $formats = [
        'Y-m-d\TH:i',
        'Y-m-d\TH:i:s',
        'Y-m-d H:i',
        'Y-m-d H:i:s',
        'Y-m-d',
        'd/m/Y H:i',
        'd/m/Y H:i:s',
        'd/m/Y',
    ];

    foreach ($formats as $format) {
        $dt = DateTime::createFromFormat($format, $raw);
        if ($dt instanceof DateTime) {
            return $dt->format('Y-m-d H:i:s');
        }
    }

    $fallback = date_create($raw);
    if ($fallback instanceof DateTime) {
        return $fallback->format('Y-m-d H:i:s');
    }

    return null;
}

$drawDate = null;
if ($drawDateRaw !== '') {
    $drawDate = parse_draw_date($drawDateRaw);
    if ($drawDate === null) {
        json_response(['ok' => false, 'error' => 'Data invalida'], 400);
    }
}

$budget = null;
if ($budgetRaw !== '') {
    if (!is_numeric($budgetRaw)) {
        json_response(['ok' => false, 'error' => 'Budget invalido'], 400);
    }
    $budget = (float)$budgetRaw;
}

$dharmaCode = strtoupper(random_token(6));

$pdo = db();
$stmt = $pdo->prepare(
    'INSERT INTO `groups` (admin_id, title, description, draw_date, budget_limit, status, dharma_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    (int)$admin['id'],
    $title,
    $description !== '' ? $description : null,
    $drawDate,
    $budget,
    'open',
    $dharmaCode
]);

$groupId = (int)$pdo->lastInsertId();

json_response([
    'ok' => true,
    'group' => [
        'id' => $groupId,
        'title' => $title,
        'description' => $description,
        'draw_date' => $drawDate,
        'budget_limit' => $budget,
        'status' => 'open',
        'dharma_code' => $dharmaCode,
    ],
]);
