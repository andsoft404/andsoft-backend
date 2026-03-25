<?php
/**
 * Orders API
 */

function listOrders() {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT * FROM orders ORDER BY created_at DESC')->fetchAll();
    $result = [];
    foreach ($rows as $r) {
        $result[] = [
            'id'      => $r['id'],
            'name'    => $r['name'],
            'email'   => $r['email'],
            'phone'   => $r['phone'],
            'project' => $r['project'],
            'message' => $r['message'],
            'service' => $r['service'],
            'date'    => $r['created_at']
        ];
    }
    jsonResponse($result);
}

function deleteOrders() {
    requireSuper();
    $db = getDB();
    $db->exec('DELETE FROM orders');
    jsonResponse(['success' => true]);
}

// Public: submit from frontend order form
function submitOrder() {
    $data = getInput();
    $name    = isset($data['name'])    ? trim($data['name']) : '';
    $email   = isset($data['email'])   ? trim($data['email']) : '';
    $phone   = isset($data['phone'])   ? trim($data['phone']) : '';
    $project = isset($data['project']) ? trim($data['project']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';
    $service = isset($data['service']) ? trim($data['service']) : '';

    if ($name === '') {
        jsonError('Нэр оруулна уу');
    }

    $db = getDB();
    $stmt = $db->prepare('INSERT INTO orders (name, email, phone, project, message, service) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$name, $email, $phone, $project, $message, $service]);

    // Auto-create notification
    $notif = $db->prepare('INSERT INTO notifications (type, text) VALUES (?, ?)');
    $notif->execute(['order', $name . ' захиалга өглөө']);

    jsonResponse(['success' => true]);
}
