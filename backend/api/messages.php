<?php
/**
 * Messages API
 */

function listMessages() {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT * FROM messages ORDER BY created_at DESC')->fetchAll();
    $result = [];
    foreach ($rows as $r) {
        $result[] = [
            'id'      => $r['id'],
            'name'    => $r['name'],
            'email'   => $r['email'],
            'phone'   => $r['phone'],
            'message' => $r['message'],
            'service' => $r['service'],
            'date'    => $r['created_at']
        ];
    }
    jsonResponse($result);
}

function deleteMessages() {
    requireSuper();
    $db = getDB();
    $db->exec('DELETE FROM messages');
    jsonResponse(['success' => true]);
}

// Public: submit from frontend contact form
function submitMessage() {
    $data = getInput();
    $name    = isset($data['name'])    ? trim($data['name']) : '';
    $email   = isset($data['email'])   ? trim($data['email']) : '';
    $phone   = isset($data['phone'])   ? trim($data['phone']) : '';
    $message = isset($data['message']) ? trim($data['message']) : '';
    $service = isset($data['service']) ? trim($data['service']) : '';

    if ($name === '' || $message === '') {
        jsonError('Нэр, мессеж оруулна уу');
    }

    $db = getDB();
    $stmt = $db->prepare('INSERT INTO messages (name, email, phone, message, service) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$name, $email, $phone, $message, $service]);

    // Auto-create notification
    $notif = $db->prepare('INSERT INTO notifications (type, text) VALUES (?, ?)');
    $notif->execute(['message', $name . ' мессеж илгээлээ']);

    jsonResponse(['success' => true]);
}
