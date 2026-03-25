<?php
/**
 * Advantages API (nested: sections -> items)
 */
require_once __DIR__ . '/activity.php';

function listAdvantages() {
    requireAuth();
    $db = getDB();
    $secs = $db->query('SELECT * FROM advantage_sections ORDER BY sort_order ASC, id ASC')->fetchAll();
    $result = [];
    foreach ($secs as $sec) {
        $items = $db->prepare('SELECT * FROM advantage_items WHERE section_id = ? ORDER BY sort_order ASC, id ASC');
        $items->execute([$sec['id']]);
        $itemList = [];
        foreach ($items->fetchAll() as $it) {
            $itemList[] = [
                'id'    => $it['id'],
                'icon'  => $it['icon'],
                'title' => $it['title'],
                'desc'  => $it['description']
            ];
        }
        $result[] = [
            'id'     => $sec['id'],
            'number' => $sec['number'],
            'title'  => $sec['title'],
            'items'  => $itemList
        ];
    }
    jsonResponse($result);
}

function saveAdvSection() {
    requireSuper();
    $data = getInput();
    $db = getDB();

    $id     = isset($data['id'])     ? (int)$data['id'] : 0;
    $number = isset($data['number']) ? $data['number'] : '01';
    $title  = isset($data['title'])  ? trim($data['title']) : '';

    if ($title === '') jsonError('Гарчиг оруулна уу');

    if ($id > 0) {
        $stmt = $db->prepare('UPDATE advantage_sections SET number=?, title=? WHERE id=?');
        $stmt->execute([$number, $title, $id]);
    } else {
        $max = $db->query('SELECT COALESCE(MAX(sort_order),0)+1 FROM advantage_sections')->fetchColumn();
        $stmt = $db->prepare('INSERT INTO advantage_sections (number, title, sort_order) VALUES (?, ?, ?) RETURNING id');
        $stmt->execute([$number, $title, $max]);
        $id = $stmt->fetchColumn();
    }
    jsonResponse(['success' => true, 'id' => $id]);
}

function deleteAdvSection() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');
    $db = getDB();
    $db->prepare('DELETE FROM advantage_sections WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

function saveAdvItem() {
    requireSuper();
    $data = getInput();
    $db = getDB();

    $id    = isset($data['id'])    ? (int)$data['id'] : 0;
    $secId = isset($data['secId']) ? (int)$data['secId'] : 0;
    $icon  = isset($data['icon'])  ? $data['icon'] : '';
    $title = isset($data['title']) ? trim($data['title']) : '';
    $desc  = isset($data['desc'])  ? $data['desc'] : '';

    if ($title === '' || $secId <= 0) jsonError('Талбар дутуу байна');

    if ($id > 0) {
        $stmt = $db->prepare('UPDATE advantage_items SET icon=?, title=?, description=? WHERE id=?');
        $stmt->execute([$icon, $title, $desc, $id]);
    } else {
        $max = $db->prepare('SELECT COALESCE(MAX(sort_order),0)+1 FROM advantage_items WHERE section_id=?');
        $max->execute([$secId]);
        $order = $max->fetchColumn();
        $stmt = $db->prepare('INSERT INTO advantage_items (section_id, icon, title, description, sort_order) VALUES (?,?,?,?,?) RETURNING id');
        $stmt->execute([$secId, $icon, $title, $desc, $order]);
        $id = $stmt->fetchColumn();
    }
    jsonResponse(['success' => true, 'id' => $id]);
}

function deleteAdvItem() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');
    $db = getDB();
    $db->prepare('DELETE FROM advantage_items WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

/**
 * Replace all advantage sections and items (bulk sync)
 */
function replaceAllAdvantages() {
    requireSuper();
    $data = getInput();
    $sections = isset($data['sections']) ? $data['sections'] : [];
    if (!is_array($sections)) jsonError('sections талбар шаардлагатай');

    $db = getDB();
    $db->beginTransaction();
    try {
        $db->exec('DELETE FROM advantage_items');
        $db->exec('DELETE FROM advantage_sections');

        $secStmt = $db->prepare('INSERT INTO advantage_sections (number, title, sort_order) VALUES (?, ?, ?) RETURNING id');
        $itemStmt = $db->prepare('INSERT INTO advantage_items (section_id, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)');

        foreach ($sections as $si => $sec) {
            $secStmt->execute([
                isset($sec['number']) ? $sec['number'] : '',
                isset($sec['title']) ? $sec['title'] : '',
                $si
            ]);
            $secId = $secStmt->fetchColumn();

            $items = isset($sec['items']) ? $sec['items'] : [];
            foreach ($items as $ii => $item) {
                $itemStmt->execute([
                    $secId,
                    isset($item['icon']) ? $item['icon'] : '',
                    isset($item['title']) ? $item['title'] : '',
                    isset($item['desc']) ? $item['desc'] : '',
                    $ii
                ]);
            }
        }

        $db->commit();
        jsonResponse(['success' => true, 'count' => count($sections)]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonError('Advantages sync алдаа: ' . $e->getMessage());
    }
}
