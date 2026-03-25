<?php
/**
 * АндСофт Backend - Database Connection (PDO - PostgreSQL)
 */
require_once __DIR__ . '/config.php';

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $url = DATABASE_URL;
            if (empty($url)) {
                throw new Exception('DATABASE_URL тохируулаагүй байна');
            }
            $parts = parse_url($url);
            $host = $parts['host'];
            $port = isset($parts['port']) ? $parts['port'] : 5432;
            $dbname = ltrim($parts['path'], '/');
            $user = $parts['user'];
            $pass = isset($parts['pass']) ? $parts['pass'] : '';

            $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=prefer";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'DB холболт амжилтгүй: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
    return $pdo;
}
