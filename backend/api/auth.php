<?php
/**
 * Auth API: login, logout, session
 */

function doLogin() {
    $data = getInput();
    $login = isset($data['login']) ? trim($data['login']) : '';
    $pass  = isset($data['pw']) ? $data['pw'] : (isset($data['pass']) ? $data['pass'] : '');

    if ($login === '' || $pass === '') {
        jsonError('Нэвтрэх нэр, нууц үг оруулна уу');
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, login, pass, role, status, avatar FROM users WHERE login = ? LIMIT 1');
    $stmt->execute([$login]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['pass'])) {
        jsonError('Нэвтрэх нэр эсвэл нууц үг буруу');
    }
    if ($user['status'] === 'blocked') {
        jsonError('Таны хаяг блоклогдсон байна');
    }

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['name']    = $user['name'];
    $_SESSION['login']   = $user['login'];
    $_SESSION['role']    = $user['role'];

    jsonResponse([
        'success' => true,
        'user' => [
            'id'     => $user['id'],
            'name'   => $user['name'],
            'login'  => $user['login'],
            'role'   => $user['role'],
            'avatar' => $user['avatar']
        ]
    ]);
}

function doLogout() {
    session_destroy();
    jsonResponse(['success' => true]);
}

function getSession() {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['logged' => false]);
    }
    $db = getDB();
    $stmt = $db->prepare('SELECT id, name, login, role, avatar FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        session_destroy();
        jsonResponse(['logged' => false]);
    }
    jsonResponse([
        'logged' => true,
        'user' => $user
    ]);
}
