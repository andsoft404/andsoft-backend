const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const pool = require('./db-node');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const upload = multer(); // memory storage for FormData parsing

// Trust Render's reverse proxy (required for secure cookies behind proxy)
app.set('trust proxy', 1);

// CORS
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve admin static files (same-origin, no CORS needed)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Session
app.use(session({
  store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'andsoft-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true
  }
}));

// ======== Helpers ========
function jsonRes(res, data) { res.json({ data }); }
function jsonErr(res, msg, status = 400) { res.status(status).json({ error: msg }); }
function requireAuth(req, res) {
  if (!req.session.user_id) { jsonErr(res, 'Нэвтрээгүй', 401); return false; }
  return true;
}
function requireSuper(req, res) {
  if (!requireAuth(req, res)) return false;
  if (req.session.role !== 'super') { jsonErr(res, 'Эрх хүрэлцэхгүй', 403); return false; }
  return true;
}

// ======== Hex decode middleware (backward compat) ========
function hexDecode(hex) {
  return Buffer.from(hex, 'hex').toString('utf8');
}

app.use('/api', upload.none(), (req, res, next) => {
  // If hex-encoded FormData
  if (req.body && req.body.h) {
    try {
      const decoded = JSON.parse(hexDecode(req.body.h));
      req.apiAction = decoded.a;
      delete decoded.a;
      req.apiData = decoded;
    } catch { req.apiData = {}; }
  } else if (req.body && req.body.a) {
    req.apiAction = req.body.a;
    const d = { ...req.body };
    delete d.a;
    req.apiData = d;
  } else {
    req.apiData = req.body || {};
  }
  next();
});

// ======== API Router ========
app.post('/api', async (req, res) => {
  const action = req.apiAction || req.apiData.action;
  const data = req.apiData;

  try {
    switch (action) {
      // Auth
      case 'login': return await doLogin(req, res, data);
      case 'logout': return doLogout(req, res);
      case 'session': return doSession(req, res);

      // Users
      case 'users.list': return await listUsers(req, res);
      case 'users.save': return await saveUser(req, res, data);
      case 'users.delete': return await deleteUser(req, res, data);
      case 'users.toggle': return await toggleBlockUser(req, res, data);

      // Profile
      case 'profile.get': return await getProfile(req, res);
      case 'profile.save': return await saveProfile(req, res, data);

      // Settings
      case 'settings.get': return await getSettings(req, res);
      case 'settings.save': return await saveSettings(req, res, data);

      // Content (sidebar, about, contact)
      case 'sidebar.get': return await getContent(req, res, 'sidebar');
      case 'sidebar.save': return await saveContent(req, res, 'sidebar', data);
      case 'about.get': return await getContent(req, res, 'about');
      case 'about.save': return await saveContent(req, res, 'about', data);
      case 'contact.get': return await getContent(req, res, 'contact');
      case 'contact.save': return await saveContentContact(req, res, data);

      // CRUD
      case 'services.list': return await listCrud(req, res, 'services');
      case 'services.save': return await saveCrud(req, res, 'services', data);
      case 'services.delete': return await deleteCrud(req, res, 'services', data);
      case 'services.replaceAll': return await replaceAll(req, res, 'services', data);

      case 'team.list': return await listCrud(req, res, 'team');
      case 'team.save': return await saveCrud(req, res, 'team', data);
      case 'team.delete': return await deleteCrud(req, res, 'team', data);
      case 'team.replaceAll': return await replaceAll(req, res, 'team', data);

      case 'partners.list': return await listCrud(req, res, 'partners');
      case 'partners.save': return await saveCrud(req, res, 'partners', data);
      case 'partners.delete': return await deleteCrud(req, res, 'partners', data);
      case 'partners.replaceAll': return await replaceAll(req, res, 'partners', data);

      case 'packages.list': return await listCrud(req, res, 'packages');
      case 'packages.save': return await saveCrud(req, res, 'packages', data);
      case 'packages.delete': return await deleteCrud(req, res, 'packages', data);
      case 'packages.replaceAll': return await replaceAll(req, res, 'packages', data);

      case 'projects.list': return await listCrud(req, res, 'projects');
      case 'projects.save': return await saveCrud(req, res, 'projects', data);
      case 'projects.delete': return await deleteCrud(req, res, 'projects', data);
      case 'projects.replaceAll': return await replaceAll(req, res, 'projects', data);

      // Pricing
      case 'pricing.list': return await listPricing(req, res);
      case 'pricing.saveCat': return await savePricingCat(req, res, data);
      case 'pricing.deleteCat': return await deletePricingCat(req, res, data);
      case 'pricing.saveItem': return await savePricingItem(req, res, data);
      case 'pricing.deleteItem': return await deletePricingItem(req, res, data);
      case 'pricing.replaceAll': return await replaceAllPricing(req, res, data);

      // Advantages
      case 'advantages.list': return await listAdvantages(req, res);
      case 'advantages.saveSec': return await saveAdvSec(req, res, data);
      case 'advantages.deleteSec': return await deleteAdvSec(req, res, data);
      case 'advantages.saveItem': return await saveAdvItem(req, res, data);
      case 'advantages.deleteItem': return await deleteAdvItem(req, res, data);
      case 'advantages.replaceAll': return await replaceAllAdvantages(req, res, data);

      // Messages
      case 'messages.list': return await listMessages(req, res);
      case 'messages.delete': return await deleteMessages(req, res);
      case 'messages.submit': return await submitMessage(req, res, data);

      // Orders
      case 'orders.list': return await listOrders(req, res);
      case 'orders.delete': return await deleteOrders(req, res);
      case 'orders.submit': return await submitOrder(req, res, data);

      // Notifications
      case 'notifs.list': return await listNotifs(req, res);
      case 'notifs.count': return await unreadCount(req, res);
      case 'notifs.markRead': return await markRead(req, res);

      // Activity
      case 'activity.list': return await listActivity(req, res);
      case 'activity.log': return await logActivityAPI(req, res, data);

      // Dashboard
      case 'dashboard.stats': return await getStats(req, res);
      case 'dashboard.recent': return await getRecent(req, res);

      // Public
      case 'public.all': return await getAllPublic(req, res);

      // Install
      case 'install': return await doInstall(req, res);

      default: return jsonErr(res, 'Unknown action: ' + action, 404);
    }
  } catch (err) {
    console.error('API Error:', action, err.message);
    jsonErr(res, 'Серверийн алдаа: ' + err.message, 500);
  }
});

// ======== AUTH ========
async function doLogin(req, res, data) {
  const { login, pw } = data;
  if (!login || !pw) return jsonErr(res, 'Нэвтрэх нэр, нууц үг оруулна уу');
  const r = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
  if (!r.rows.length) return jsonErr(res, 'Хэрэглэгч олдсонгүй');
  const user = r.rows[0];
  if (user.status === 'blocked') return jsonErr(res, 'Блоклогдсон хэрэглэгч');
  const valid = await bcrypt.compare(pw, user.pass);
  console.log('Login attempt:', login, '| pw length:', pw.length, '| hash length:', user.pass.length, '| valid:', valid);
  if (!valid) return jsonErr(res, 'Нууц үг буруу');
  req.session.user_id = user.id;
  req.session.name = user.name;
  req.session.login = user.login;
  req.session.role = user.role;
  jsonRes(res, { name: user.name, role: user.role, login: user.login });
}

function doLogout(req, res) {
  req.session.destroy(() => { jsonRes(res, { success: true }); });
}

function doSession(req, res) {
  if (req.session.user_id) {
    jsonRes(res, { logged: true, name: req.session.name, role: req.session.role });
  } else {
    jsonRes(res, { logged: false });
  }
}

// ======== USERS ========
async function listUsers(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT id, name, login, role, status, avatar FROM users ORDER BY id ASC');
  jsonRes(res, r.rows);
}

async function saveUser(req, res, data) {
  if (!requireSuper(req, res)) return;
  const { id, name, login, pw, role, status } = data;
  if (!name || !login) return jsonErr(res, 'Нэр, нэвтрэх нэр оруулна уу');

  if (id) {
    const dup = await pool.query('SELECT id FROM users WHERE login = $1 AND id != $2', [login, id]);
    if (dup.rows.length) return jsonErr(res, 'Нэвтрэх нэр давхцаж байна');
    if (pw) {
      const hash = await bcrypt.hash(pw, 10);
      await pool.query('UPDATE users SET name=$1, login=$2, pass=$3, role=$4 WHERE id=$5', [name, login, hash, role || 'view', id]);
    } else {
      await pool.query('UPDATE users SET name=$1, login=$2, role=$3 WHERE id=$4', [name, login, role || 'view', id]);
    }
    jsonRes(res, { success: true, id });
  } else {
    if (!pw) return jsonErr(res, 'Нууц үг оруулна уу');
    const dup = await pool.query('SELECT id FROM users WHERE login = $1', [login]);
    if (dup.rows.length) return jsonErr(res, 'Нэвтрэх нэр давхцаж байна');
    const hash = await bcrypt.hash(pw, 10);
    const r = await pool.query('INSERT INTO users (name, login, pass, role, status) VALUES ($1,$2,$3,$4,$5) RETURNING id', [name, login, hash, role || 'view', status || 'active']);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deleteUser(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  const first = await pool.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
  if (first.rows.length && first.rows[0].id === id) return jsonErr(res, 'Үндсэн админыг устгах боломжгүй');
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  jsonRes(res, { success: true });
}

async function toggleBlockUser(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  const r = await pool.query('SELECT status FROM users WHERE id = $1', [id]);
  if (!r.rows.length) return jsonErr(res, 'Олдсонгүй');
  const newStatus = r.rows[0].status === 'blocked' ? 'active' : 'blocked';
  await pool.query('UPDATE users SET status = $1 WHERE id = $2', [newStatus, id]);
  jsonRes(res, { success: true, status: newStatus });
}

// ======== PROFILE ========
async function getProfile(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT id, name, login, role, avatar FROM users WHERE id = $1', [req.session.user_id]);
  if (!r.rows.length) return jsonErr(res, 'Хэрэглэгч олдсонгүй', 404);
  jsonRes(res, r.rows[0]);
}

async function saveProfile(req, res, data) {
  if (!requireAuth(req, res)) return;
  const uid = req.session.user_id;
  const { name, login, pass, avatar } = data;
  if (!name || !login) return jsonErr(res, 'Нэр, нэвтрэх нэр оруулна уу');
  const dup = await pool.query('SELECT id FROM users WHERE login = $1 AND id != $2', [login, uid]);
  if (dup.rows.length) return jsonErr(res, 'Нэвтрэх нэр давхцаж байна');

  if (pass) {
    const hash = await bcrypt.hash(pass, 10);
    if (avatar !== undefined) {
      await pool.query('UPDATE users SET name=$1, login=$2, pass=$3, avatar=$4 WHERE id=$5', [name, login, hash, avatar, uid]);
    } else {
      await pool.query('UPDATE users SET name=$1, login=$2, pass=$3 WHERE id=$4', [name, login, hash, uid]);
    }
  } else {
    if (avatar !== undefined) {
      await pool.query('UPDATE users SET name=$1, login=$2, avatar=$3 WHERE id=$4', [name, login, avatar, uid]);
    } else {
      await pool.query('UPDATE users SET name=$1, login=$2 WHERE id=$3', [name, login, uid]);
    }
  }
  req.session.name = name;
  req.session.login = login;
  jsonRes(res, { success: true });
}

// ======== SETTINGS ========
async function getSettings(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT * FROM settings WHERE user_id = $1', [req.session.user_id]);
  if (!r.rows.length) return jsonRes(res, { soundEnabled: true, autoRefresh: true, sidebarCollapsed: false });
  const s = r.rows[0];
  jsonRes(res, { soundEnabled: !!s.sound_enabled, autoRefresh: !!s.auto_refresh, sidebarCollapsed: !!s.sidebar_collapsed });
}

async function saveSettings(req, res, data) {
  if (!requireAuth(req, res)) return;
  const uid = req.session.user_id;
  const sound = data.soundEnabled ? 1 : 0;
  const auto = data.autoRefresh ? 1 : 0;
  const sidebar = data.sidebarCollapsed ? 1 : 0;
  const check = await pool.query('SELECT id FROM settings WHERE user_id = $1', [uid]);
  if (check.rows.length) {
    await pool.query('UPDATE settings SET sound_enabled=$1, auto_refresh=$2, sidebar_collapsed=$3 WHERE user_id=$4', [sound, auto, sidebar, uid]);
  } else {
    await pool.query('INSERT INTO settings (user_id, sound_enabled, auto_refresh, sidebar_collapsed) VALUES ($1,$2,$3,$4)', [uid, sound, auto, sidebar]);
  }
  jsonRes(res, { success: true });
}

// ======== CONTENT (sidebar, about, contact) ========
const contentCols = {
  sidebar: { logo: 'logo', subtitle: 'subtitle', email: 'email', phone: 'phone', address: 'address', facebook: 'facebook', instagram: 'instagram' },
  about: { text: '"text"', mission: 'mission', vision: 'vision' },
  contact: { email: 'email', phone: 'phone', lat: 'lat', lng: 'lng', zoom: 'zoom', popupTitle: 'popup_title', popupAddress: 'popup_address' }
};

async function getContent(req, res, table) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query(`SELECT * FROM ${table} WHERE id = 1`);
  if (!r.rows.length) return jsonRes(res, {});
  const row = r.rows[0];
  delete row.id;
  if (table === 'contact') {
    row.popupTitle = row.popup_title;
    row.popupAddress = row.popup_address;
    delete row.popup_title;
    delete row.popup_address;
  }
  jsonRes(res, row);
}

async function saveContent(req, res, table, data) {
  if (!requireSuper(req, res)) return;
  const cols = contentCols[table];
  const sets = [];
  const vals = [];
  let i = 1;
  for (const [jsKey, dbCol] of Object.entries(cols)) {
    if (data[jsKey] !== undefined) {
      sets.push(`${dbCol} = $${i}`);
      vals.push(data[jsKey]);
      i++;
    }
  }
  if (sets.length) {
    await pool.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = 1`, vals);
  }
  jsonRes(res, { success: true });
}

async function saveContentContact(req, res, data) {
  return saveContent(req, res, 'contact', data);
}

// ======== GENERIC CRUD ========
const tableFields = {
  services: { cols: ['icon', 'title', 'description', 'sort_order'], jsKeys: { icon: 'icon', title: 'title', desc: 'description' } },
  team: { cols: ['role', 'description', 'image', 'sort_order'], jsKeys: { role: 'role', desc: 'description', image: 'image' } },
  partners: { cols: ['name', 'logo', 'url', 'sort_order'], jsKeys: { name: 'name', logo: 'logo', url: 'url' } },
  packages: { cols: ['name', 'icon', 'price', 'popular', 'features', 'sort_order'], jsKeys: { name: 'name', icon: 'icon', price: 'price', popular: 'popular', features: 'features' } },
  projects: { cols: ['name', 'short_desc', 'description', 'image', 'category', 'tags', 'price', 'sort_order'], jsKeys: { name: 'name', shortDesc: 'short_desc', desc: 'description', image: 'image', category: 'category', tags: 'tags', price: 'price' } }
};

const selectMap = {
  services: 'SELECT id, icon, title, description as "desc", sort_order FROM services ORDER BY sort_order ASC, id ASC',
  team: 'SELECT id, role, description as "desc", image, sort_order FROM team ORDER BY sort_order ASC, id ASC',
  partners: 'SELECT id, name, logo, url, sort_order FROM partners ORDER BY sort_order ASC, id ASC',
  packages: 'SELECT id, name, icon, price, popular, features, sort_order FROM packages ORDER BY sort_order ASC, id ASC',
  projects: 'SELECT id, name, short_desc as "shortDesc", description as "desc", image, category, tags, price, sort_order FROM projects ORDER BY sort_order ASC, id ASC'
};

async function listCrud(req, res, table) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query(selectMap[table]);
  const rows = r.rows.map(row => {
    if (row.popular !== undefined) row.popular = !!row.popular;
    if (row.features && typeof row.features === 'string') {
      try { row.features = JSON.parse(row.features); } catch { row.features = []; }
    }
    return row;
  });
  jsonRes(res, rows);
}

async function saveCrud(req, res, table, data) {
  if (!requireSuper(req, res)) return;
  const tf = tableFields[table];
  const id = data.id ? parseInt(data.id) : 0;

  if (id) {
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [jsKey, dbCol] of Object.entries(tf.jsKeys)) {
      if (data[jsKey] !== undefined) {
        let val = data[jsKey];
        if (dbCol === 'features' && Array.isArray(val)) val = JSON.stringify(val);
        if (dbCol === 'popular') val = val ? 1 : 0;
        sets.push(`${dbCol} = $${i}`);
        vals.push(val);
        i++;
      }
    }
    vals.push(id);
    await pool.query(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${i}`, vals);
    jsonRes(res, { success: true, id });
  } else {
    const cols = [];
    const placeholders = [];
    const vals = [];
    let i = 1;
    for (const [jsKey, dbCol] of Object.entries(tf.jsKeys)) {
      let val = data[jsKey] || '';
      if (dbCol === 'features' && Array.isArray(val)) val = JSON.stringify(val);
      if (dbCol === 'popular') val = val ? 1 : 0;
      cols.push(dbCol);
      placeholders.push(`$${i}`);
      vals.push(val);
      i++;
    }
    const maxR = await pool.query(`SELECT COALESCE(MAX(sort_order),0)+1 as next FROM ${table}`);
    cols.push('sort_order');
    placeholders.push(`$${i}`);
    vals.push(maxR.rows[0].next);
    const r = await pool.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id`, vals);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deleteCrud(req, res, table, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  jsonRes(res, { success: true });
}

async function replaceAll(req, res, table, data) {
  if (!requireSuper(req, res)) return;
  const items = data.items || [];
  const tf = tableFields[table];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${table}`);
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const cols = [];
      const placeholders = [];
      const vals = [];
      let i = 1;
      for (const [jsKey, dbCol] of Object.entries(tf.jsKeys)) {
        let val = item[jsKey] || '';
        if (dbCol === 'features' && Array.isArray(val)) val = JSON.stringify(val);
        if (dbCol === 'popular') val = val ? 1 : 0;
        cols.push(dbCol);
        placeholders.push(`$${i}`);
        vals.push(val);
        i++;
      }
      cols.push('sort_order');
      placeholders.push(`$${i}`);
      vals.push(idx);
      await client.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')})`, vals);
    }
    await client.query('COMMIT');
    jsonRes(res, { success: true, count: items.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ======== PRICING ========
async function listPricing(req, res) {
  if (!requireAuth(req, res)) return;
  const cats = await pool.query('SELECT * FROM pricing_categories ORDER BY sort_order ASC, id ASC');
  const result = [];
  for (const cat of cats.rows) {
    const items = await pool.query('SELECT * FROM pricing_items WHERE category_id = $1 ORDER BY sort_order ASC, id ASC', [cat.id]);
    result.push({
      id: cat.id, name: cat.name, icon: cat.icon,
      items: items.rows.map(it => ({ id: it.id, icon: it.icon, title: it.title, price: it.price, desc: it.description, popular: !!it.popular }))
    });
  }
  jsonRes(res, result);
}

async function savePricingCat(req, res, data) {
  if (!requireSuper(req, res)) return;
  const { id, name, icon } = data;
  if (!name) return jsonErr(res, 'Нэр оруулна уу');
  if (id) {
    await pool.query('UPDATE pricing_categories SET name=$1, icon=$2 WHERE id=$3', [name, icon || '', id]);
    jsonRes(res, { success: true, id });
  } else {
    const max = await pool.query('SELECT COALESCE(MAX(sort_order),0)+1 as next FROM pricing_categories');
    const r = await pool.query('INSERT INTO pricing_categories (name, icon, sort_order) VALUES ($1,$2,$3) RETURNING id', [name, icon || '', max.rows[0].next]);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deletePricingCat(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  await pool.query('DELETE FROM pricing_items WHERE category_id = $1', [id]);
  await pool.query('DELETE FROM pricing_categories WHERE id = $1', [id]);
  jsonRes(res, { success: true });
}

async function savePricingItem(req, res, data) {
  if (!requireSuper(req, res)) return;
  const { id, categoryId, icon, title, price, desc, popular } = data;
  if (id) {
    await pool.query('UPDATE pricing_items SET icon=$1, title=$2, price=$3, description=$4, popular=$5 WHERE id=$6', [icon, title, price, desc || '', popular ? 1 : 0, id]);
    jsonRes(res, { success: true, id });
  } else {
    const catId = categoryId || data.catId;
    const max = await pool.query('SELECT COALESCE(MAX(sort_order),0)+1 as next FROM pricing_items WHERE category_id=$1', [catId]);
    const r = await pool.query('INSERT INTO pricing_items (category_id, icon, title, price, description, popular, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id', [catId, icon, title, price, desc || '', popular ? 1 : 0, max.rows[0].next]);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deletePricingItem(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  await pool.query('DELETE FROM pricing_items WHERE id = $1', [id]);
  jsonRes(res, { success: true });
}

async function replaceAllPricing(req, res, data) {
  if (!requireSuper(req, res)) return;
  const categories = data.categories || [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM pricing_items');
    await client.query('DELETE FROM pricing_categories');
    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      const cr = await client.query('INSERT INTO pricing_categories (name, icon, sort_order) VALUES ($1,$2,$3) RETURNING id', [cat.name || '', cat.icon || '', ci]);
      const catId = cr.rows[0].id;
      const items = cat.items || [];
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii];
        await client.query('INSERT INTO pricing_items (category_id, icon, title, price, description, popular, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)', [catId, it.icon || '', it.title || '', it.price || '', it.desc || '', it.popular ? 1 : 0, ii]);
      }
    }
    await client.query('COMMIT');
    jsonRes(res, { success: true, count: categories.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ======== ADVANTAGES ========
async function listAdvantages(req, res) {
  if (!requireAuth(req, res)) return;
  const secs = await pool.query('SELECT * FROM advantage_sections ORDER BY sort_order ASC, id ASC');
  const result = [];
  for (const sec of secs.rows) {
    const items = await pool.query('SELECT * FROM advantage_items WHERE section_id = $1 ORDER BY sort_order ASC, id ASC', [sec.id]);
    result.push({
      id: sec.id, number: sec.number, title: sec.title,
      items: items.rows.map(it => ({ id: it.id, icon: it.icon, title: it.title, desc: it.description }))
    });
  }
  jsonRes(res, result);
}

async function saveAdvSec(req, res, data) {
  if (!requireSuper(req, res)) return;
  const { id, number, title } = data;
  if (!title) return jsonErr(res, 'Гарчиг оруулна уу');
  if (id) {
    await pool.query('UPDATE advantage_sections SET number=$1, title=$2 WHERE id=$3', [number || '', title, id]);
    jsonRes(res, { success: true, id });
  } else {
    const max = await pool.query('SELECT COALESCE(MAX(sort_order),0)+1 as next FROM advantage_sections');
    const r = await pool.query('INSERT INTO advantage_sections (number, title, sort_order) VALUES ($1,$2,$3) RETURNING id', [number || '', title, max.rows[0].next]);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deleteAdvSec(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  await pool.query('DELETE FROM advantage_items WHERE section_id = $1', [id]);
  await pool.query('DELETE FROM advantage_sections WHERE id = $1', [id]);
  jsonRes(res, { success: true });
}

async function saveAdvItem(req, res, data) {
  if (!requireSuper(req, res)) return;
  const { id, sectionId, icon, title, desc } = data;
  if (id) {
    await pool.query('UPDATE advantage_items SET icon=$1, title=$2, description=$3 WHERE id=$4', [icon, title, desc || '', id]);
    jsonRes(res, { success: true, id });
  } else {
    const secId = sectionId || data.secId;
    const max = await pool.query('SELECT COALESCE(MAX(sort_order),0)+1 as next FROM advantage_items WHERE section_id=$1', [secId]);
    const r = await pool.query('INSERT INTO advantage_items (section_id, icon, title, description, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id', [secId, icon, title, desc || '', max.rows[0].next]);
    jsonRes(res, { success: true, id: r.rows[0].id });
  }
}

async function deleteAdvItem(req, res, data) {
  if (!requireSuper(req, res)) return;
  const id = parseInt(data.id);
  if (!id) return jsonErr(res, 'ID шаардлагатай');
  await pool.query('DELETE FROM advantage_items WHERE id = $1', [id]);
  jsonRes(res, { success: true });
}

async function replaceAllAdvantages(req, res, data) {
  if (!requireSuper(req, res)) return;
  const sections = data.sections || [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM advantage_items');
    await client.query('DELETE FROM advantage_sections');
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      const sr = await client.query('INSERT INTO advantage_sections (number, title, sort_order) VALUES ($1,$2,$3) RETURNING id', [sec.number || '', sec.title || '', si]);
      const secId = sr.rows[0].id;
      const items = sec.items || [];
      for (let ii = 0; ii < items.length; ii++) {
        const it = items[ii];
        await client.query('INSERT INTO advantage_items (section_id, icon, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)', [secId, it.icon || '', it.title || '', it.desc || '', ii]);
      }
    }
    await client.query('COMMIT');
    jsonRes(res, { success: true, count: sections.length });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ======== MESSAGES ========
async function listMessages(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT id, name, email, phone, message, service, created_at as date FROM messages ORDER BY created_at DESC');
  jsonRes(res, r.rows);
}

async function deleteMessages(req, res) {
  if (!requireSuper(req, res)) return;
  await pool.query('DELETE FROM messages');
  jsonRes(res, { success: true });
}

async function submitMessage(req, res, data) {
  const { name, email, phone, message, service } = data;
  if (!name || !message) return jsonErr(res, 'Нэр, мессеж оруулна уу');
  await pool.query('INSERT INTO messages (name, email, phone, message, service) VALUES ($1,$2,$3,$4,$5)', [name || '', email || '', phone || '', message, service || '']);
  await pool.query('INSERT INTO notifications (type, text) VALUES ($1,$2)', ['message', name + ' мессеж илгээлээ']);
  jsonRes(res, { success: true });
}

// ======== ORDERS ========
async function listOrders(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT id, name, email, phone, project, message, service, created_at as date FROM orders ORDER BY created_at DESC');
  jsonRes(res, r.rows);
}

async function deleteOrders(req, res) {
  if (!requireSuper(req, res)) return;
  await pool.query('DELETE FROM orders');
  jsonRes(res, { success: true });
}

async function submitOrder(req, res, data) {
  const { name, email, phone, project, message, service } = data;
  if (!name) return jsonErr(res, 'Нэр оруулна уу');
  await pool.query('INSERT INTO orders (name, email, phone, project, message, service) VALUES ($1,$2,$3,$4,$5,$6)', [name, email || '', phone || '', project || '', message || '', service || '']);
  await pool.query('INSERT INTO notifications (type, text) VALUES ($1,$2)', ['order', name + ' захиалга өглөө']);
  jsonRes(res, { success: true });
}

// ======== NOTIFICATIONS ========
async function listNotifs(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT id, type, text, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 50');
  jsonRes(res, r.rows.map(n => ({ id: n.id, type: n.type, text: n.text, read: !!n.is_read, time: n.created_at })));
}

async function markRead(req, res) {
  if (!requireAuth(req, res)) return;
  await pool.query('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
  jsonRes(res, { success: true });
}

async function unreadCount(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT COUNT(*) FROM notifications WHERE is_read = 0');
  jsonRes(res, { count: parseInt(r.rows[0].count) });
}

// ======== ACTIVITY ========
async function listActivity(req, res) {
  if (!requireAuth(req, res)) return;
  const r = await pool.query('SELECT created_at, admin_name, action, section, item FROM activity ORDER BY created_at DESC LIMIT 50');
  jsonRes(res, r.rows.map(a => ({ time: a.created_at, admin: a.admin_name, action: a.action, section: a.section, item: a.item })));
}

async function logActivityAPI(req, res, data) {
  if (!requireAuth(req, res)) return;
  const { action, section, item } = data;
  if (action && section) {
    const admin = req.session.name || 'System';
    await pool.query('INSERT INTO activity (admin_name, action, section, item) VALUES ($1,$2,$3,$4)', [admin, action, section, item || '']);
    await pool.query('DELETE FROM activity WHERE id NOT IN (SELECT id FROM activity ORDER BY created_at DESC LIMIT 50)');
  }
  jsonRes(res, { ok: true });
}

// ======== DASHBOARD ========
async function getStats(req, res) {
  if (!requireAuth(req, res)) return;
  const tables = ['services', 'team', 'partners', 'projects', 'messages', 'orders', 'users', 'pricing_items', 'packages', 'advantage_items'];
  const stats = {};
  for (const t of tables) {
    const r = await pool.query(`SELECT COUNT(*) FROM ${t}`);
    const key = t === 'pricing_items' ? 'pricing' : t === 'advantage_items' ? 'advantages' : t;
    stats[key] = parseInt(r.rows[0].count);
  }
  jsonRes(res, stats);
}

async function getRecent(req, res) {
  if (!requireAuth(req, res)) return;
  const msgs = await pool.query('SELECT name, email, message, created_at as date FROM messages ORDER BY created_at DESC LIMIT 5');
  const ords = await pool.query('SELECT name, email, project, created_at as date FROM orders ORDER BY created_at DESC LIMIT 5');
  jsonRes(res, { messages: msgs.rows, orders: ords.rows });
}

// ======== PUBLIC DATA ========
async function getAllPublic(req, res) {
  const sidebar = await pool.query('SELECT * FROM sidebar WHERE id = 1');
  const about = await pool.query('SELECT * FROM about WHERE id = 1');
  const contact = await pool.query('SELECT * FROM contact WHERE id = 1');
  const services = await pool.query('SELECT icon, title, description as "desc" FROM services ORDER BY sort_order ASC, id ASC');
  const team = await pool.query('SELECT role, description as "desc", image FROM team ORDER BY sort_order ASC, id ASC');
  const partners = await pool.query('SELECT name, logo, url FROM partners ORDER BY sort_order ASC, id ASC');

  // Pricing
  const cats = await pool.query('SELECT * FROM pricing_categories ORDER BY sort_order ASC, id ASC');
  const pricing = [];
  for (const cat of cats.rows) {
    const items = await pool.query('SELECT icon, title, price, description as "desc", popular FROM pricing_items WHERE category_id = $1 ORDER BY sort_order ASC, id ASC', [cat.id]);
    pricing.push({ name: cat.name, icon: cat.icon, items: items.rows.map(it => ({ ...it, popular: !!it.popular })) });
  }

  // Packages
  const pkgs = await pool.query('SELECT name, icon, price, popular, features FROM packages ORDER BY sort_order ASC, id ASC');
  const packages = pkgs.rows.map(p => {
    let features = p.features;
    if (typeof features === 'string') { try { features = JSON.parse(features); } catch { features = []; } }
    return { ...p, popular: !!p.popular, features: features || [] };
  });

  // Advantages
  const secs = await pool.query('SELECT * FROM advantage_sections ORDER BY sort_order ASC, id ASC');
  const advantages = [];
  for (const sec of secs.rows) {
    const items = await pool.query('SELECT icon, title, description as "desc" FROM advantage_items WHERE section_id = $1 ORDER BY sort_order ASC, id ASC', [sec.id]);
    advantages.push({ number: sec.number, title: sec.title, items: items.rows });
  }

  // Projects
  const projects = await pool.query('SELECT name, short_desc as "shortDesc", description as "desc", image, category, tags, price FROM projects ORDER BY sort_order ASC, id ASC');

  // Contact formatting
  let contactData = contact.rows[0] || {};
  delete contactData.id;
  if (contactData.popup_title !== undefined) {
    contactData.popupTitle = contactData.popup_title;
    contactData.popupAddress = contactData.popup_address;
    delete contactData.popup_title;
    delete contactData.popup_address;
  }

  let sidebarData = sidebar.rows[0] || {};
  delete sidebarData.id;
  let aboutData = about.rows[0] || {};
  delete aboutData.id;

  jsonRes(res, {
    sidebar: sidebarData,
    about: aboutData,
    contact: contactData,
    services: services.rows,
    team: team.rows,
    partners: partners.rows,
    pricing,
    packages,
    advantages,
    projects: projects.rows
  });
}

// ======== INSTALL ========
async function doInstall(req, res) {
  // Allow install only if no users exist (first setup) or user is super admin
  try {
    const userCheck = await pool.query('SELECT COUNT(*) as cnt FROM users');
    if (parseInt(userCheck.rows[0].cnt) > 0 && !req.session.user_id) {
      return jsonErr(res, 'Суулгалт зөвхөн анхны удаа эсвэл super admin эрхтэй хийгдэнэ', 403);
    }
    if (parseInt(userCheck.rows[0].cnt) > 0 && req.session.role !== 'super') {
      return jsonErr(res, 'Эрх хүрэлцэхгүй', 403);
    }
  } catch (e) { /* table doesn't exist yet — allow install */ }
  const sqlPath = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const statements = sql.split(';').map(s => s.replace(/--.*$/gm, '').trim()).filter(s => s);
  const results = [];
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      results.push('OK');
    } catch (e) {
      results.push('SKIP: ' + e.message);
    }
  }
  // Default admin (upsert — always reset password to ensure it works)
  const hash = await bcrypt.hash('andsoft123', 10);
  const check = await pool.query('SELECT id FROM users WHERE login = $1', ['admin']);
  if (!check.rows.length) {
    await pool.query('INSERT INTO users (name, login, pass, role, status) VALUES ($1,$2,$3,$4,$5)', ['Админ', 'admin', hash, 'super', 'active']);
  } else {
    await pool.query('UPDATE users SET pass = $1 WHERE login = $2', [hash, 'admin']);
  }
  // Verify hash works
  const verify = await bcrypt.compare('andsoft123', hash);
  console.log('Install: bcrypt verify =', verify, ', hash length =', hash.length);
  // Singletons
  await pool.query("INSERT INTO sidebar (id, subtitle) VALUES (1, '') ON CONFLICT (id) DO NOTHING");
  await pool.query("INSERT INTO about (id, \"text\") VALUES (1, '') ON CONFLICT (id) DO NOTHING");
  await pool.query("INSERT INTO contact (id, email) VALUES (1, '') ON CONFLICT (id) DO NOTHING");
  jsonRes(res, { success: true, message: 'Суулгалт амжилттай', details: results });
}

// ======== START ========
app.listen(PORT, () => {
  console.log(`АндСофт Backend running on port ${PORT}`);
});
