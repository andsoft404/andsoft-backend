<?php
/**
 * Dashboard API
 */

function getStats() {
    requireAuth();
    $db = getDB();

    $stats = [
        'services'  => (int)$db->query('SELECT COUNT(*) FROM services')->fetchColumn(),
        'team'      => (int)$db->query('SELECT COUNT(*) FROM team')->fetchColumn(),
        'partners'  => (int)$db->query('SELECT COUNT(*) FROM partners')->fetchColumn(),
        'projects'  => (int)$db->query('SELECT COUNT(*) FROM projects')->fetchColumn(),
        'messages'  => (int)$db->query('SELECT COUNT(*) FROM messages')->fetchColumn(),
        'orders'    => (int)$db->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
        'users'     => (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'pricing'   => (int)$db->query('SELECT COUNT(*) FROM pricing_items')->fetchColumn(),
        'packages'  => (int)$db->query('SELECT COUNT(*) FROM packages')->fetchColumn(),
        'advantages'=> (int)$db->query('SELECT COUNT(*) FROM advantage_items')->fetchColumn()
    ];

    jsonResponse($stats);
}

function getRecent() {
    requireAuth();
    $db = getDB();

    $messages = $db->query('SELECT name, email, message, created_at as date FROM messages ORDER BY created_at DESC LIMIT 5')->fetchAll();
    $orders   = $db->query('SELECT name, email, project, created_at as date FROM orders ORDER BY created_at DESC LIMIT 5')->fetchAll();

    jsonResponse([
        'messages' => $messages,
        'orders'   => $orders
    ]);
}
