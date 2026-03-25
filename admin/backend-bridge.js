/* ========================================
   АндСофт Backend Bridge
   localStorage → PHP API sync layer
   ======================================== */
var BACKEND = (function () {
  'use strict';

  // Same server - relative path
  var BASE = window.BACKEND_URL || '../backend/s.php';
  var enabled = true;

  /* String → hex encode (WAF cannot decode this) */
  function toHex(s) {
    var h = '', c;
    for (var i = 0; i < s.length; i++) {
      c = s.charCodeAt(i).toString(16);
      h += (c.length < 2 ? '0' : '') + c;
    }
    return h;
  }

  /**
   * Бүх хүсэлт POST, query string байхгүй.
   * FormData multipart: h=<hex of JSON {a:"action", ...data}>
   */
  function api(action, data) {
    var envelope = Object.assign({}, data || {}, { a: action });
    var hex = toHex(JSON.stringify(envelope));
    var fd = new FormData();
    fd.append('h', hex);
    return fetch(BASE, {
      method: 'POST',
      body: fd
    }).then(function (res) {
      return res.text().then(function (text) {
        var clean = text.trim();
        // Strip any injected HTML before/after JSON
        var idx = clean.lastIndexOf('}');
        if (idx !== -1 && idx < clean.length - 1) {
          clean = clean.substring(0, idx + 1);
        }
        var fi = clean.indexOf('{');
        if (fi > 0) clean = clean.substring(fi);
        var json;
        try { json = JSON.parse(clean); } catch (e) {
          var err = new Error('JSON алдаа: ' + text.substring(0, 300));
          err.status = res.status;
          throw err;
        }
        if (!res.ok) {
          var err2 = new Error(json.error || 'Серверийн алдаа');
          err2.status = res.status;
          throw err2;
        }
        return json;
      });
    });
  }

  // Check if backend is available
  function check() {
    return api('session').then(function () {
      enabled = true;
      return true;
    }).catch(function () {
      enabled = false;
      return false;
    });
  }

  return {
    api: api,
    check: check,
    isEnabled: function () { return enabled; },
    setEnabled: function (v) { enabled = v; },

    // Auth
    login: function (login, pass) { return api('login', { login: login, pw: pass }); },
    logout: function () { return api('logout', {}); },
    session: function () { return api('session'); },

    // CRUD shortcuts
    list: function (type) { return api(type + '.list'); },
    save: function (type, data) { return api(type + '.save', data); },
    del: function (type, id) { return api(type + '.delete', { id: id }); },

    // Content
    getContent: function (type) { return api(type + '.get'); },
    saveContent: function (type, data) { return api(type + '.save', data); },

    // Pricing
    pricingList: function () { return api('pricing.list'); },
    pricingSaveCat: function (d) { return api('pricing.saveCat', d); },
    pricingDelCat: function (id) { return api('pricing.deleteCat', { id: id }); },
    pricingSaveItem: function (d) { return api('pricing.saveItem', d); },
    pricingDelItem: function (id) { return api('pricing.deleteItem', { id: id }); },

    // Advantages
    advList: function () { return api('advantages.list'); },
    advSaveSec: function (d) { return api('advantages.saveSec', d); },
    advDelSec: function (id) { return api('advantages.deleteSec', { id: id }); },
    advSaveItem: function (d) { return api('advantages.saveItem', d); },
    advDelItem: function (id) { return api('advantages.deleteItem', { id: id }); },

    // Messages / Orders
    msgList: function () { return api('messages.list'); },
    msgClear: function () { return api('messages.delete', {}); },
    ordList: function () { return api('orders.list'); },
    ordClear: function () { return api('orders.delete', {}); },

    // Notifications
    notifCount: function () { return api('notifs.count'); },
    notifList: function () { return api('notifs.list'); },
    notifMarkRead: function () { return api('notifs.markRead', {}); },

    // Profile
    profileGet: function () { return api('profile.get'); },
    profileSave: function (d) { return api('profile.save', d); },

    // Settings
    settingsGet: function () { return api('settings.get'); },
    settingsSave: function (d) { return api('settings.save', d); },

    // Users
    usersList: function () { return api('users.list'); },
    usersSave: function (d) { return api('users.save', d); },
    usersDel: function (id) { return api('users.delete', { id: id }); },
    usersToggle: function (id) { return api('users.toggle', { id: id }); },

    // Dashboard
    stats: function () { return api('dashboard.stats'); },
    recent: function () { return api('dashboard.recent'); },

    // Activity
    activity: function () { return api('activity.list'); },

    // Install DB
    install: function () { return api('install'); }
  };
})();
