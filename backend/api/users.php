<?php
/**
 * Users CRUD API
 */
require_once __DIR__ . '/activity.php';

function listUsers() {
    requireAuth();
    $db = getDB();
    $rows = $db->query('SELECT id, name, login, role, status FROM users ORDER BY id ASC')->fetchAll();
    jsonResponse($rows);
}

function saveUser() {
    requireSuper();
    $data = getInput();
    $db = getDB();

    $id    = isset($data['id']) ? (int)$data['id'] : 0;
    $name  = isset($data['name'])  ? trim($data['name']) : '';
    $login = isset($data['login']) ? trim($data['login']) : '';
    $pass  = isset($data['pw']) ? $data['pw'] : (isset($data['pass']) ? $data['pass'] : '');
    $role  = isset($data['role'])  ? $data['role'] : 'view';

    if ($name === '' || $login === '') {
        jsonError('Нэр, нэвтрэх нэр оруулна уу');
    }
    if (!in_array($role, ['super', 'view'])) $role = 'view';

    if ($id > 0) {
        // Update
        $user = $db->prepare('SELECT id FROM users WHERE id = ?');
        $user->execute([$id]);
        if (!$user->fetch()) jsonError('Хэрэглэгч олдсонгүй', 404);

        // Check login uniqueness
        $dup = $db->prepare('SELECT id FROM users WHERE login = ? AND id != ?');
        $dup->execute([$login, $id]);
        if ($dup->fetch()) jsonError('Нэвтрэх нэр давхцаж байна');

        if ($pass !== '') {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $stmt = $db->prepare('UPDATE users SET name=?, login=?, pass=?, role=? WHERE id=?');
            $stmt->execute([$name, $login, $hash, $role, $id]);
        } else {
            $stmt = $db->prepare('UPDATE users SET name=?, login=?, role=? WHERE id=?');
            $stmt->execute([$name, $login, $role, $id]);
        }
    } else {
        // Create
        if ($pass === '') jsonError('Нууц үг оруулна уу');

        $dup = $db->prepare('SELECT id FROM users WHERE login = ?');
        $dup->execute([$login]);
        if ($dup->fetch()) jsonError('Нэвтрэх нэр давхцаж байна');

        $hash = password_hash($pass, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO users (name, login, pass, role, status) VALUES (?, ?, ?, ?, ?) RETURNING id');
        $stmt->execute([$name, $login, $hash, $role, 'active']);
        $id = $stmt->fetchColumn();
    }

    jsonResponse(['success' => true, 'id' => $id]);
}

function deleteUser() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');

    $db = getDB();
    // Protect first user
    $first = $db->query('SELECT id FROM users ORDER BY id ASC LIMIT 1')->fetch();
    if ($first && (int)$first['id'] === $id) {
        jsonError('Үндсэн админыг устгах боломжгүй');
    }

    $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    logActivityDB('delete', 'Эрх', '');
    jsonResponse(['success' => true]);
}

function toggleBlock() {
    requireSuper();
    $data = getInput();
    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) jsonError('ID шаардлагатай');

    $db = getDB();
    $first = $db->query('SELECT id FROM users ORDER BY id ASC LIMIT 1')->fetch();
    if ($first && (int)$first['id'] === $id) {
        jsonError('Үндсэн админыг блоклох боломжгүй');
    }

    $stmt = $db->prepare('SELECT status FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) jsonError('Хэрэглэгч олдсонгүй', 404);

    $newStatus = ($user['status'] === 'blocked') ? 'active' : 'blocked';
    $upd = $db->prepare('UPDATE users SET status = ? WHERE id = ?');
    $upd->execute([$newStatus, $id]);
    logActivityDB('edit', 'Эрх', $newStatus === 'blocked' ? 'Блоклогдсон' : 'Идэвхтэй');
    jsonResponse(['success' => true, 'status' => $newStatus]);
}
