<?php
/**
 * АндСофт Backend - Main API Router
 * InfinityFree WAF bypass: action нь base64 дотор нуугдсан
 * POST body: d=<base64 of JSON {a:"action", ...data}>
 */
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Global error handler — always return JSON
set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
});
set_error_handler(function ($severity, $msg, $file, $line) {
    throw new ErrorException($msg, 0, $severity, $file, $line);
});

require_once __DIR__ . '/helpers.php';

setupCORS();

// Extract action from base64 envelope
$envelope = getEnvelope();
$action = isset($envelope['a']) ? $envelope['a'] : '';
// Fallback: old-style query param (for install.html etc.)
if ($action === '' && isset($_GET['action'])) {
    $action = $_GET['action'];
}

switch ($action) {
    // ===== AUTH =====
    case 'login':        require __DIR__ . '/api/auth.php'; doLogin(); break;
    case 'logout':       require __DIR__ . '/api/auth.php'; doLogout(); break;
    case 'session':      require __DIR__ . '/api/auth.php'; getSession(); break;

    // ===== USERS =====
    case 'users.list':   require __DIR__ . '/api/users.php'; listUsers(); break;
    case 'users.save':   require __DIR__ . '/api/users.php'; saveUser(); break;
    case 'users.delete': require __DIR__ . '/api/users.php'; deleteUser(); break;
    case 'users.toggle': require __DIR__ . '/api/users.php'; toggleBlock(); break;

    // ===== PROFILE =====
    case 'profile.get':  require __DIR__ . '/api/profile.php'; getProfile(); break;
    case 'profile.save': require __DIR__ . '/api/profile.php'; saveProfile(); break;

    // ===== SETTINGS =====
    case 'settings.get':  require __DIR__ . '/api/settings.php'; getSettings(); break;
    case 'settings.save': require __DIR__ . '/api/settings.php'; saveSettings(); break;

    // ===== SIDEBAR =====
    case 'sidebar.get':  require __DIR__ . '/api/content.php'; getContent('sidebar'); break;
    case 'sidebar.save': require __DIR__ . '/api/content.php'; saveContent('sidebar'); break;

    // ===== ABOUT =====
    case 'about.get':    require __DIR__ . '/api/content.php'; getContent('about'); break;
    case 'about.save':   require __DIR__ . '/api/content.php'; saveContent('about'); break;

    // ===== CONTACT =====
    case 'contact.get':  require __DIR__ . '/api/content.php'; getContent('contact'); break;
    case 'contact.save': require __DIR__ . '/api/content.php'; saveContent('contact'); break;

    // ===== SERVICES =====
    case 'services.list':       require __DIR__ . '/api/crud.php'; listItems('services'); break;
    case 'services.save':       require __DIR__ . '/api/crud.php'; saveItem('services'); break;
    case 'services.delete':     require __DIR__ . '/api/crud.php'; deleteItem('services'); break;
    case 'services.replaceAll': require __DIR__ . '/api/crud.php'; replaceAll('services'); break;

    // ===== TEAM =====
    case 'team.list':       require __DIR__ . '/api/crud.php'; listItems('team'); break;
    case 'team.save':       require __DIR__ . '/api/crud.php'; saveItem('team'); break;
    case 'team.delete':     require __DIR__ . '/api/crud.php'; deleteItem('team'); break;
    case 'team.replaceAll': require __DIR__ . '/api/crud.php'; replaceAll('team'); break;

    // ===== PARTNERS =====
    case 'partners.list':       require __DIR__ . '/api/crud.php'; listItems('partners'); break;
    case 'partners.save':       require __DIR__ . '/api/crud.php'; saveItem('partners'); break;
    case 'partners.delete':     require __DIR__ . '/api/crud.php'; deleteItem('partners'); break;
    case 'partners.replaceAll': require __DIR__ . '/api/crud.php'; replaceAll('partners'); break;

    // ===== PRICING =====
    case 'pricing.list':       require __DIR__ . '/api/pricing.php'; listPricing(); break;
    case 'pricing.saveCat':    require __DIR__ . '/api/pricing.php'; savePricingCat(); break;
    case 'pricing.deleteCat':  require __DIR__ . '/api/pricing.php'; deletePricingCat(); break;
    case 'pricing.saveItem':   require __DIR__ . '/api/pricing.php'; savePricingItem(); break;
    case 'pricing.deleteItem': require __DIR__ . '/api/pricing.php'; deletePricingItem(); break;
    case 'pricing.replaceAll': require __DIR__ . '/api/pricing.php'; replaceAllPricing(); break;

    // ===== PACKAGES =====
    case 'packages.list':       require __DIR__ . '/api/crud.php'; listItems('packages'); break;
    case 'packages.save':       require __DIR__ . '/api/crud.php'; saveItem('packages'); break;
    case 'packages.delete':     require __DIR__ . '/api/crud.php'; deleteItem('packages'); break;
    case 'packages.replaceAll': require __DIR__ . '/api/crud.php'; replaceAll('packages'); break;

    // ===== ADVANTAGES =====
    case 'advantages.list':       require __DIR__ . '/api/advantages.php'; listAdvantages(); break;
    case 'advantages.saveSec':    require __DIR__ . '/api/advantages.php'; saveAdvSection(); break;
    case 'advantages.deleteSec':  require __DIR__ . '/api/advantages.php'; deleteAdvSection(); break;
    case 'advantages.saveItem':   require __DIR__ . '/api/advantages.php'; saveAdvItem(); break;
    case 'advantages.deleteItem': require __DIR__ . '/api/advantages.php'; deleteAdvItem(); break;
    case 'advantages.replaceAll': require __DIR__ . '/api/advantages.php'; replaceAllAdvantages(); break;

    // ===== PROJECTS =====
    case 'projects.list':       require __DIR__ . '/api/crud.php'; listItems('projects'); break;
    case 'projects.save':       require __DIR__ . '/api/crud.php'; saveItem('projects'); break;
    case 'projects.delete':     require __DIR__ . '/api/crud.php'; deleteItem('projects'); break;
    case 'projects.replaceAll': require __DIR__ . '/api/crud.php'; replaceAll('projects'); break;

    // ===== MESSAGES =====
    case 'messages.list':   require __DIR__ . '/api/messages.php'; listMessages(); break;
    case 'messages.delete': require __DIR__ . '/api/messages.php'; deleteMessages(); break;
    case 'messages.submit': require __DIR__ . '/api/messages.php'; submitMessage(); break;

    // ===== ORDERS =====
    case 'orders.list':   require __DIR__ . '/api/orders.php'; listOrders(); break;
    case 'orders.delete': require __DIR__ . '/api/orders.php'; deleteOrders(); break;
    case 'orders.submit': require __DIR__ . '/api/orders.php'; submitOrder(); break;

    // ===== NOTIFICATIONS =====
    case 'notifs.list':     require __DIR__ . '/api/notifs.php'; listNotifs(); break;
    case 'notifs.markRead': require __DIR__ . '/api/notifs.php'; markRead(); break;
    case 'notifs.count':    require __DIR__ . '/api/notifs.php'; unreadCount(); break;

    // ===== ACTIVITY =====
    case 'activity.list': require __DIR__ . '/api/activity.php'; listActivity(); break;

    // ===== DASHBOARD =====
    case 'dashboard.stats': require __DIR__ . '/api/dashboard.php'; getStats(); break;
    case 'dashboard.recent': require __DIR__ . '/api/dashboard.php'; getRecent(); break;

    // ===== INSTALL =====
    case 'install': require __DIR__ . '/api/install.php'; doInstall(); break;

    // ===== PUBLIC DATA (for frontend site) =====
    case 'public.all': require __DIR__ . '/api/public_data.php'; getAllPublic(); break;

    default:
        jsonError('Unknown action: ' . $action, 404);
}
