<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$name = trim((string)($input['name'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
    json_response(['ok' => false, 'error' => 'Nome, email e senha sao obrigatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['ok' => false, 'error' => 'Email invalido'], 400);
}
if (strlen($password) < 6) {
    json_response(['ok' => false, 'error' => 'Senha muito curta'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id FROM admins WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_response(['ok' => false, 'error' => 'Email ja cadastrado'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$adminId = (int)$pdo->lastInsertId();

$_SESSION['admin_id'] = $adminId;

json_response([
    'ok' => true,
    'admin' => ['id' => $adminId, 'name' => $name, 'email' => $email],
]);
