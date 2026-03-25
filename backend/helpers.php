<?php
/**
 * АндСофт Backend - Auth helpers
 */
require_once __DIR__ . '/db.php';

ob_start();
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($msg, $code = 400) {
    jsonResponse(['error' => $msg], $code);
}

function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        jsonError('Нэвтрэх шаардлагатай', 401);
    }
}

function requireSuper() {
    requireAuth();
    if ($_SESSION['role'] !== 'super') {
        jsonError('Эрх хүрэлцэхгүй', 403);
    }
}

/**
 * Decode the hex-encoded envelope from POST body.
 * FormData field: h=<hex of JSON {a:"action", ...data}>
 * Cached so it's only decoded once per request.
 */
function getEnvelope() {
    static $cached = null;
    if ($cached !== null) return $cached;
    $raw = '';
    if (isset($_POST['h'])) {
        // Primary: hex encoded
        $raw = @hex2bin($_POST['h']);
        if ($raw === false) $raw = '';
    } elseif (isset($_POST['d'])) {
        // Fallback: base64
        $raw = base64_decode($_POST['d']);
    } elseif (isset($_POST['payload'])) {
        $raw = base64_decode($_POST['payload']);
    } else {
        $raw = file_get_contents('php://input');
    }
    $data = json_decode($raw, true);
    $cached = is_array($data) ? $data : [];
    return $cached;
}

/**
 * Get input data (envelope without the 'a' key).
 */
function getInput() {
    $envelope = getEnvelope();
    unset($envelope['a']);
    return $envelope;
}

function sanitize($val) {
    if (is_string($val)) {
        return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
    }
    return $val;
}

function setupCORS() {
    $origin = CORS_ORIGIN;
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
