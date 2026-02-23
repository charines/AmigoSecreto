<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$admin = require_admin();
json_response(['ok' => true, 'admin' => $admin]);
