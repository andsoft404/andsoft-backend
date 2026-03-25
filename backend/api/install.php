<?php
/**
 * Install / DB Setup endpoint
 * GET api.php?action=install
 */
function doInstall() {
    $db = getDB();

    $sql = file_get_contents(__DIR__ . '/../database.sql');
    // Split by semicolons and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    $results = [];
    foreach ($statements as $stmt) {
        if (empty($stmt) || strpos($stmt, '--') === 0) continue;
        try {
            $db->exec($stmt);
            $results[] = 'OK';
        } catch (PDOException $e) {
            $results[] = 'SKIP: ' . $e->getMessage();
        }
    }

    // Create default admin with hashed password
    $hash = password_hash('andsoft123', PASSWORD_DEFAULT);
    $check = $db->prepare('SELECT id FROM users WHERE login = ?');
    $check->execute(['admin']);
    if (!$check->fetch()) {
        $ins = $db->prepare('INSERT INTO users (name, login, pass, role, status) VALUES (?, ?, ?, ?, ?)');
        $ins->execute(['Админ', 'admin', $hash, 'super', 'active']);
    }

    // Ensure singleton rows exist
    $db->exec("INSERT INTO sidebar (id, subtitle) VALUES (1, '') ON CONFLICT (id) DO NOTHING");
    $db->exec("INSERT INTO about (id, \"text\") VALUES (1, '') ON CONFLICT (id) DO NOTHING");
    $db->exec("INSERT INTO contact (id, email) VALUES (1, '') ON CONFLICT (id) DO NOTHING");

    jsonResponse(['success' => true, 'message' => 'Суулгалт амжилттай', 'details' => $results]);
}
