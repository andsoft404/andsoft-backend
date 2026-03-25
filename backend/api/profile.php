<?php
/**
 * Profile API
 */

function getProfile() {
    requireAuth();
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, login, role, avatar FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) jsonError('Хэрэглэгч олдсонгүй', 404);
    jsonResponse($user);
}

function saveProfile() {
    requireAuth();
    $data = getInput();
    $db = getDB();
    $uid = $_SESSION['user_id'];

    $name   = isset($data['name'])   ? trim($data['name']) : '';
    $login  = isset($data['login'])  ? trim($data['login']) : '';
    $pass   = isset($data['pass'])   ? $data['pass'] : '';
    $avatar = isset($data['avatar']) ? $data['avatar'] : null;

    if ($name === '' || $login === '') {
        jsonError('Нэр, нэвтрэх нэр оруулна уу');
    }

    // Check login uniqueness
    $dup = $db->prepare('SELECT id FROM users WHERE login = ? AND id != ?');
    $dup->execute([$login, $uid]);
    if ($dup->fetch()) jsonError('Нэвтрэх нэр давхцаж байна');

    if ($pass !== '') {
        $hash = password_hash($pass, PASSWORD_DEFAULT);
        if ($avatar !== null) {
            $stmt = $db->prepare('UPDATE users SET name=?, login=?, pass=?, avatar=? WHERE id=?');
            $stmt->execute([$name, $login, $hash, $avatar, $uid]);
        } else {
            $stmt = $db->prepare('UPDATE users SET name=?, login=?, pass=? WHERE id=?');
            $stmt->execute([$name, $login, $hash, $uid]);
        }
    } else {
        if ($avatar !== null) {
            $stmt = $db->prepare('UPDATE users SET name=?, login=?, avatar=? WHERE id=?');
            $stmt->execute([$name, $login, $avatar, $uid]);
        } else {
            $stmt = $db->prepare('UPDATE users SET name=?, login=? WHERE id=?');
            $stmt->execute([$name, $login, $uid]);
        }
    }

    $_SESSION['name']  = $name;
    $_SESSION['login'] = $login;

    jsonResponse(['success' => true]);
}
