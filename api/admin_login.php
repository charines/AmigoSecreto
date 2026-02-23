<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$input = json_input();
$email = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

if ($email === '' || $password === '') {
    json_response(['ok' => false, 'error' => 'Email e senha sao obrigatorios'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, (string)$admin['password_hash'])) {
    json_response(['ok' => false, 'error' => 'Credenciais invalidas'], 401);
}

$_SESSION['admin_id'] = (int)$admin['id'];

json_response([
    'ok' => true,
    'admin' => ['id' => (int)$admin['id'], 'name' => $admin['name'], 'email' => $admin['email']],
]);
