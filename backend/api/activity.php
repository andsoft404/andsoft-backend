<?php
/**
 * Activity Log API
 */

function listActivity() {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT * FROM activity ORDER BY created_at DESC LIMIT 50')->fetchAll();
    $result = [];
    foreach ($rows as $r) {
        $result[] = [
            'time'    => $r['created_at'],
            'admin'   => $r['admin_name'],
            'action'  => $r['action'],
            'section' => $r['section'],
            'item'    => $r['item']
        ];
    }
    jsonResponse($result);
}

function logActivityDB($action, $section, $item = '') {
    try {
        $db = getDB();
        $admin = isset($_SESSION['name']) ? $_SESSION['name'] : 'System';
        $stmt = $db->prepare('INSERT INTO activity (admin_name, action, section, item) VALUES (?, ?, ?, ?)');
        $stmt->execute([$admin, $action, $section, $item]);
        // Keep max 50
        $db->exec('DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY created_at DESC LIMIT 50)');
    } catch (Exception $e) {
        // Silently fail - activity logging shouldn't break operations
    }
}

function logActivityAPI() {
    requireAuth();
    $input = getInput();
    $action  = sanitize($input['action'] ?? '');
    $section = sanitize($input['section'] ?? '');
    $item    = sanitize($input['item'] ?? '');
    if ($action && $section) {
        logActivityDB($action, $section, $item);
    }
    jsonResponse(['ok' => true]);
}
