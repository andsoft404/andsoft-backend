<?php
/**
 * Pricing API (nested: categories -> items)
 */
require_once __DIR__ . '/activity.php';

function listPricing() {
    requireAuth();
    $db = getDB();
    $cats = $db->query('SELECT * FROM pricing_categories ORDER BY sort_order ASC, id ASC')->fetchAll();
    $result = [];
    foreach ($cats as $cat) {
        $items = $db->prepare('SELECT * FROM pricing_items WHERE category_id = ? ORDER BY sort_order ASC, id ASC');
        $items->execute([$cat['id']]);
        $itemList = [];
        foreach ($items->fetchAll() as $it) {
            $itemList[] = [
                'id'      => $it['id'],
                'icon'    => $it['icon'],
                'title'   => $it['title'],
                'price'   => $it['price'],
                'desc'    => $it['description'],
                'popular' => (bool)$it['popular']
            ];
        }
        $result[] = [
            'id'    => $cat['id'],
            'name'  => $cat['name'],
            'icon'  => $cat['icon'],
            'items' => $itemList
        ];
    }
    jsonResponse($result);
}

function savePricingCat() {
    requireSuper();
    $data = getInput();
    $db = getDB();

    $id   = isset($data['id'])   ? (int)$data['id'] : 0;
    $name = isset($data['name']) ? trim($data['name']) : '';
    $icon = isset($data['icon']) ? $data['icon'] : '';

    if ($name === '') jsonError('Категорийн нэр оруулна уу');

    if ($id > 0) {
        $stmt = $db->prepare('UPDATE pricing_categories SET name=?, icon=? WHERE id=?');
        $stmt->execute([$name, $icon, $id]);
    } else {
        $max = $db->query('SELECT COALESCE(MAX(sort_order),0)+1 FROM pricing_categories')->fetchColumn();
        $stmt = $db->prepare('INSERT INTO pricing_categories (name, icon, sort_order) VALUES (?, ?, ?) RETURNING id');
        $stmt->execute([$name, $icon, $max]);
        $id = $stmt->fetchColumn();
    }
    jsonResponse(['success' => true, 'id' => $id]);
}

function deletePricingCat() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');
    $db = getDB();
    $db->prepare('DELETE FROM pricing_categories WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

function savePricingItem() {
    requireSuper();
    $data = getInput();
    $db = getDB();

    $id      = isset($data['id'])      ? (int)$data['id'] : 0;
    $catId   = isset($data['catId'])    ? (int)$data['catId'] : 0;
    $icon    = isset($data['icon'])     ? $data['icon'] : '';
    $title   = isset($data['title'])    ? trim($data['title']) : '';
    $price   = isset($data['price'])    ? $data['price'] : '';
    $desc    = isset($data['desc'])     ? $data['desc'] : '';
    $popular = !empty($data['popular']) ? 1 : 0;

    if ($title === '' || $catId <= 0) jsonError('Талбар дутуу байна');

    if ($id > 0) {
        $stmt = $db->prepare('UPDATE pricing_items SET icon=?, title=?, price=?, description=?, popular=? WHERE id=?');
        $stmt->execute([$icon, $title, $price, $desc, $popular, $id]);
    } else {
        $max = $db->prepare('SELECT COALESCE(MAX(sort_order),0)+1 FROM pricing_items WHERE category_id=?');
        $max->execute([$catId]);
        $order = $max->fetchColumn();
        $stmt = $db->prepare('INSERT INTO pricing_items (category_id, icon, title, price, description, popular, sort_order) VALUES (?,?,?,?,?,?,?) RETURNING id');
        $stmt->execute([$catId, $icon, $title, $price, $desc, $popular, $order]);
        $id = $stmt->fetchColumn();
    }
    jsonResponse(['success' => true, 'id' => $id]);
}

function deletePricingItem() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');
    $db = getDB();
    $db->prepare('DELETE FROM pricing_items WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true]);
}

/**
 * Replace all pricing categories and items (bulk sync)
 */
function replaceAllPricing() {
    requireSuper();
    $data = getInput();
    $categories = isset($data['categories']) ? $data['categories'] : [];
    if (!is_array($categories)) jsonError('categories талбар шаардлагатай');

    $db = getDB();
    $db->beginTransaction();
    try {
        $db->exec('DELETE FROM pricing_items');
        $db->exec('DELETE FROM pricing_categories');

        $catStmt = $db->prepare('INSERT INTO pricing_categories (name, icon, sort_order) VALUES (?, ?, ?) RETURNING id');
        $itemStmt = $db->prepare('INSERT INTO pricing_items (category_id, icon, title, price, description, popular, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');

        foreach ($categories as $ci => $cat) {
            $catStmt->execute([
                isset($cat['name']) ? $cat['name'] : '',
                isset($cat['icon']) ? $cat['icon'] : '',
                $ci
            ]);
            $catId = $catStmt->fetchColumn();

            $items = isset($cat['items']) ? $cat['items'] : [];
            foreach ($items as $ii => $item) {
                $itemStmt->execute([
                    $catId,
                    isset($item['icon']) ? $item['icon'] : '',
                    isset($item['title']) ? $item['title'] : '',
                    isset($item['price']) ? $item['price'] : '',
                    isset($item['desc']) ? $item['desc'] : '',
                    !empty($item['popular']) ? 1 : 0,
                    $ii
                ]);
            }
        }

        $db->commit();
        jsonResponse(['success' => true, 'count' => count($categories)]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonError('Pricing sync алдаа: ' . $e->getMessage());
    }
}
