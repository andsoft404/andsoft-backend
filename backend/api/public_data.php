<?php
/**
 * Public Data API - for the frontend website
 * No auth required
 */

function getAllPublic() {
    $db = getDB();

    // Sidebar
    $sidebar = $db->query('SELECT * FROM sidebar WHERE id = 1')->fetch();
    unset($sidebar['id']);

    // About
    $about = $db->query('SELECT * FROM about WHERE id = 1')->fetch();
    unset($about['id']);

    // Contact
    $contact = $db->query('SELECT * FROM contact WHERE id = 1')->fetch();
    if ($contact) {
        $contact['popupTitle']   = $contact['popup_title'];
        $contact['popupAddress'] = $contact['popup_address'];
        unset($contact['popup_title'], $contact['popup_address'], $contact['id']);
    }

    // Services
    $services = $db->query('SELECT icon, title, description as "desc" FROM services ORDER BY sort_order ASC, id ASC')->fetchAll();

    // Team
    $team = $db->query('SELECT role, description as "desc", image FROM team ORDER BY sort_order ASC, id ASC')->fetchAll();

    // Partners
    $partners = $db->query('SELECT name, logo, url FROM partners ORDER BY sort_order ASC, id ASC')->fetchAll();

    // Pricing (nested)
    $cats = $db->query('SELECT * FROM pricing_categories ORDER BY sort_order ASC, id ASC')->fetchAll();
    $pricing = [];
    foreach ($cats as $cat) {
        $items = $db->prepare('SELECT icon, title, price, description as "desc", popular FROM pricing_items WHERE category_id = ? ORDER BY sort_order ASC, id ASC');
        $items->execute([$cat['id']]);
        $itemList = $items->fetchAll();
        foreach ($itemList as &$it) { $it['popular'] = (bool)$it['popular']; }
        $pricing[] = [
            'name'  => $cat['name'],
            'icon'  => $cat['icon'],
            'items' => $itemList
        ];
    }

    // Packages
    $packages = $db->query('SELECT name, icon, price, popular, features FROM packages ORDER BY sort_order ASC, id ASC')->fetchAll();
    foreach ($packages as &$pkg) {
        $pkg['popular'] = (bool)$pkg['popular'];
        $pkg['features'] = json_decode($pkg['features'], true) ?: [];
    }

    // Advantages (nested)
    $secs = $db->query('SELECT * FROM advantage_sections ORDER BY sort_order ASC, id ASC')->fetchAll();
    $advantages = [];
    foreach ($secs as $sec) {
        $items = $db->prepare('SELECT icon, title, description as "desc" FROM advantage_items WHERE section_id = ? ORDER BY sort_order ASC, id ASC');
        $items->execute([$sec['id']]);
        $advantages[] = [
            'number' => $sec['number'],
            'title'  => $sec['title'],
            'items'  => $items->fetchAll()
        ];
    }

    // Projects
    $projects = $db->query('SELECT name, short_desc as "shortDesc", description as "desc", image, category, tags, price FROM projects ORDER BY sort_order ASC, id ASC')->fetchAll();

    jsonResponse([
        'sidebar'    => $sidebar ?: new \stdClass(),
        'about'      => $about ?: new \stdClass(),
        'contact'    => $contact ?: new \stdClass(),
        'services'   => $services,
        'team'       => $team,
        'partners'   => $partners,
        'pricing'    => $pricing,
        'packages'   => $packages,
        'advantages' => $advantages,
        'projects'   => $projects
    ]);
}
