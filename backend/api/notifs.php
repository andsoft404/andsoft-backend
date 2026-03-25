<?php
/**
 * Notifications API
 */

function listNotifs() {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50')->fetchAll();
    $result = [];
    foreach ($rows as $r) {
        $result[] = [
            'id'   => $r['id'],
            'type' => $r['type'],
            'text' => $r['text'],
            'read' => (bool)$r['is_read'],
            'time' => $r['created_at']
        ];
    }
    jsonResponse($result);
}

function markRead() {
    requireAuth();
    $db = getDB();
    $db->exec('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
    jsonResponse(['success' => true]);
}

function unreadCount() {
    requireAuth();
    $db = getDB();
    $count = $db->query('SELECT COUNT(*) FROM notifications WHERE is_read = 0')->fetchColumn();
    jsonResponse(['count' => (int)$count]);
}
