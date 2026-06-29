<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'ok'      => true,
    'path'    => __DIR__,
    'php'     => PHP_VERSION,
    'time'    => date('Y-m-d H:i:s'),
]);
