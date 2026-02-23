<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$_SESSION = [];
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

json_response(['ok' => true]);
