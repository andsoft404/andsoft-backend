<?php
/**
 * Generic CRUD API for: services, team, partners, packages, projects
 */
require_once __DIR__ . '/activity.php';

$tableFields = [
    'services' => [
        'cols'  => ['icon', 'title', 'description', 'sort_order'],
        'input' => ['icon', 'title', 'desc', 'sort_order'],
        'req'   => ['title']
    ],
    'team' => [
        'cols'  => ['role', 'description', 'image', 'sort_order'],
        'input' => ['role', 'desc', 'image', 'sort_order'],
        'req'   => ['role']
    ],
    'partners' => [
        'cols'  => ['name', 'logo', 'url', 'sort_order'],
        'input' => ['name', 'logo', 'url', 'sort_order'],
        'req'   => ['name']
    ],
    'packages' => [
        'cols'  => ['name', 'icon', 'price', 'popular', 'features', 'sort_order'],
        'input' => ['name', 'icon', 'price', 'popular', 'features', 'sort_order'],
        'req'   => ['name']
    ],
    'projects' => [
        'cols'  => ['name', 'short_desc', 'description', 'image', 'category', 'tags', 'price', 'sort_order'],
        'input' => ['name', 'shortDesc', 'desc', 'image', 'category', 'tags', 'price', 'sort_order'],
        'req'   => ['name']
    ]
];

function listItems($table) {
    requireAuth();
    $db = getDB();
    $rows = $db->query("SELECT * FROM $table ORDER BY sort_order ASC, id ASC")->fetchAll();

    // Map DB column names to frontend-friendly names
    global $tableFields;
    $cfg = $tableFields[$table];
    $mapped = [];
    foreach ($rows as $row) {
        $item = ['id' => $row['id']];
        for ($i = 0; $i < count($cfg['cols']); $i++) {
            $dbCol = $cfg['cols'][$i];
            $jsKey = $cfg['input'][$i];
            $val = isset($row[$dbCol]) ? $row[$dbCol] : '';
            // Convert features JSON string to array for packages
            if ($table === 'packages' && $dbCol === 'features') {
                $val = json_decode($val, true);
                if (!is_array($val)) $val = [];
            }
            // Convert popular to boolean
            if ($dbCol === 'popular') {
                $val = (bool)$val;
            }
            $item[$jsKey] = $val;
        }
        $mapped[] = $item;
    }
    jsonResponse($mapped);
}

function saveItem($table) {
    requireSuper();
    global $tableFields;
    $cfg  = $tableFields[$table];
    $data = getInput();
    $db   = getDB();

    $id = isset($data['id']) ? (int)$data['id'] : 0;

    // Check required fields
    foreach ($cfg['req'] as $r) {
        $key = $r;
        // Map DB col to input key
        $idx = array_search($r, $cfg['cols']);
        if ($idx !== false) $key = $cfg['input'][$idx];
        if (empty($data[$key])) {
            jsonError('Талбар дутуу байна');
        }
    }

    $sets = [];
    $vals = [];
    for ($i = 0; $i < count($cfg['cols']); $i++) {
        $dbCol = $cfg['cols'][$i];
        $jsKey = $cfg['input'][$i];
        $val = isset($data[$jsKey]) ? $data[$jsKey] : '';

        // Convert features array to JSON for packages
        if ($table === 'packages' && $dbCol === 'features' && is_array($val)) {
            $val = json_encode($val, JSON_UNESCAPED_UNICODE);
        }
        // Convert popular to int
        if ($dbCol === 'popular') {
            $val = $val ? 1 : 0;
        }
        // sort_order default
        if ($dbCol === 'sort_order' && $val === '') {
            $val = 0;
        }

        $sets[] = "\"$dbCol\" = ?";
        $vals[] = $val;
    }

    if ($id > 0) {
        $sql = "UPDATE $table SET " . implode(', ', $sets) . " WHERE id = ?";
        $vals[] = $id;
        $db->prepare($sql)->execute($vals);
    } else {
        $colNames = implode(', ', array_map(function ($c) { return "\"$c\""; }, $cfg['cols']));
        $placeholders = implode(', ', array_fill(0, count($cfg['cols']), '?'));
        $sql = "INSERT INTO $table ($colNames) VALUES ($placeholders) RETURNING id";
        $stmt = $db->prepare($sql);
        $stmt->execute($vals);
        $id = $stmt->fetchColumn();
    }

    jsonResponse(['success' => true, 'id' => $id]);
}

function deleteItem($table) {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');

    $db = getDB();
    // Get name before delete
    $row = $db->prepare("SELECT * FROM $table WHERE id = ?")->execute([$id]);
    $db->prepare("DELETE FROM $table WHERE id = ?")->execute([$id]);
    $sectionNames = ['services'=>'Үйлчилгээ','team'=>'Хамт олон','partners'=>'Хамтрагч','packages'=>'Багц','projects'=>'Төсөл'];
    logActivityDB('delete', isset($sectionNames[$table]) ? $sectionNames[$table] : $table, '');
    jsonResponse(['success' => true]);
}

/**
 * Replace all items in a table from a full array (bulk sync from localStorage)
 */
function replaceAll($table) {
    requireSuper();
    global $tableFields;
    $cfg  = $tableFields[$table];
    $data = getInput();
    $items = isset($data['items']) ? $data['items'] : [];
    if (!is_array($items)) jsonError('items талбар шаардлагатай');

    $db = getDB();
    $db->beginTransaction();
    try {
        // Clear existing
        $db->exec("DELETE FROM $table");

        // Insert each item
        $colNames = implode(', ', array_map(function ($c) { return "\"$c\""; }, $cfg['cols']));
        $placeholders = implode(', ', array_fill(0, count($cfg['cols']), '?'));
        $sql = "INSERT INTO $table ($colNames) VALUES ($placeholders)";
        $stmt = $db->prepare($sql);

        foreach ($items as $order => $item) {
            $vals = [];
            for ($i = 0; $i < count($cfg['cols']); $i++) {
                $dbCol = $cfg['cols'][$i];
                $jsKey = $cfg['input'][$i];
                $val = isset($item[$jsKey]) ? $item[$jsKey] : '';

                if ($table === 'packages' && $dbCol === 'features' && is_array($val)) {
                    $val = json_encode($val, JSON_UNESCAPED_UNICODE);
                }
                if ($dbCol === 'popular') {
                    $val = $val ? 1 : 0;
                }
                if ($dbCol === 'sort_order') {
                    $val = $val !== '' ? (int)$val : $order;
                }
                $vals[] = $val;
            }
            $stmt->execute($vals);
        }

        $db->commit();
        jsonResponse(['success' => true, 'count' => count($items)]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonError('Bulk sync алдаа: ' . $e->getMessage());
    }
}
