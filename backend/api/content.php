<?php
/**
 * Content API: sidebar, about, contact (singleton rows)
 */
require_once __DIR__ . '/activity.php';

$contentColumns = [
    'sidebar' => ['logo', 'subtitle', 'email', 'phone', 'address', 'facebook', 'instagram'],
    'about'   => ['text', 'mission', 'vision'],
    'contact' => ['email', 'phone', 'lat', 'lng', 'zoom', 'popup_title', 'popup_address']
];

function getContent($table) {
    global $contentColumns;
    requireAuth();
    $db = getDB();
    $row = $db->query("SELECT * FROM $table WHERE id = 1")->fetch();
    if (!$row) {
        $row = array_fill_keys($contentColumns[$table], '');
    }
    // Map snake_case to camelCase for contact
    if ($table === 'contact') {
        $row['popupTitle']   = isset($row['popup_title'])   ? $row['popup_title'] : '';
        $row['popupAddress'] = isset($row['popup_address']) ? $row['popup_address'] : '';
        unset($row['popup_title'], $row['popup_address']);
    }
    unset($row['id']);
    jsonResponse($row);
}

function saveContent($table) {
    global $contentColumns;
    requireSuper();
    $data = getInput();
    $db = getDB();
    $cols = $contentColumns[$table];

    $sets = [];
    $vals = [];
    foreach ($cols as $col) {
        // Handle camelCase mapping for contact
        $key = $col;
        if ($col === 'popup_title')   $key = 'popupTitle';
        if ($col === 'popup_address') $key = 'popupAddress';

        $val = isset($data[$key]) ? $data[$key] : (isset($data[$col]) ? $data[$col] : '');
        $sets[] = "\"$col\" = ?";
        $vals[] = $val;
    }

    $sql = "UPDATE $table SET " . implode(', ', $sets) . " WHERE id = 1";
    $stmt = $db->prepare($sql);
    $stmt->execute($vals);
    $sectionNames = ['sidebar'=>'Цэс','about'=>'Танилцуулга','contact'=>'Холбоо барих'];
    logActivityDB('edit', isset($sectionNames[$table]) ? $sectionNames[$table] : $table, '');
    jsonResponse(['success' => true]);
}
