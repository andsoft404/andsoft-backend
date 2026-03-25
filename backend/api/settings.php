<?php
/**
 * Settings API
 */

function getSettings() {
    requireAuth();
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM settings WHERE user_id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $s = $stmt->fetch();
    if (!$s) {
        $s = ['sound_enabled' => 1, 'auto_refresh' => 1, 'sidebar_collapsed' => 0];
    }
    jsonResponse([
        'soundEnabled'     => (bool)$s['sound_enabled'],
        'autoRefresh'      => (bool)$s['auto_refresh'],
        'sidebarCollapsed' => (bool)$s['sidebar_collapsed']
    ]);
}

function saveSettings() {
    requireAuth();
    $data = getInput();
    $db = getDB();
    $uid = $_SESSION['user_id'];

    $sound   = isset($data['soundEnabled'])     ? ($data['soundEnabled'] ? 1 : 0) : 1;
    $auto    = isset($data['autoRefresh'])       ? ($data['autoRefresh'] ? 1 : 0) : 1;
    $sidebar = isset($data['sidebarCollapsed'])  ? ($data['sidebarCollapsed'] ? 1 : 0) : 0;

    $check = $db->prepare('SELECT id FROM settings WHERE user_id = ?');
    $check->execute([$uid]);

    if ($check->fetch()) {
        $stmt = $db->prepare('UPDATE settings SET sound_enabled=?, auto_refresh=?, sidebar_collapsed=? WHERE user_id=?');
        $stmt->execute([$sound, $auto, $sidebar, $uid]);
    } else {
        $stmt = $db->prepare('INSERT INTO settings (user_id, sound_enabled, auto_refresh, sidebar_collapsed) VALUES (?, ?, ?, ?)');
        $stmt->execute([$uid, $sound, $auto, $sidebar]);
    }

    jsonResponse(['success' => true]);
}
