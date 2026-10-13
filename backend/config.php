<?php
declare(strict_types=1);

function database(): PDO
{
    static $connection = null;
    if ($connection instanceof PDO) {
        return $connection;
    }

    $localFile = __DIR__ . '/config.local.php';
    $local = file_exists($localFile) ? require $localFile : [];
    $host = $local['host'] ?? (getenv('DB_HOST') ?: '127.0.0.1');
    $port = $local['port'] ?? (getenv('DB_PORT') ?: '3306');
    $name = $local['name'] ?? (getenv('DB_NAME') ?: 'corazones_limenos');
    $user = $local['user'] ?? (getenv('DB_USER') ?: 'root');
    $password = $local['password'] ?? (getenv('DB_PASSWORD') ?: '');

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    $connection = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $connection;
}
