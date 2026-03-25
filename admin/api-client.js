/* ========================================
   АндСофт API Client
   Backend PHP API-тай холбогдох
   ======================================== */
var API = (function () {
  'use strict';

  // Backend URL - InfinityFree дээр тавихдаа өөрчилнө
  var BASE = '../backend/api.php';

  function request(action, data, method) {
    method = method || (data ? 'POST' : 'GET');
    var url = BASE + '?action=' + encodeURIComponent(action);

    var opts = {
      method: method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (data && method !== 'GET') {
      opts.body = JSON.stringify(data);
    }

    return fetch(url, opts).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok) {
          var err = new Error(json.error || 'Серверийн алдаа');
          err.status = res.status;
          throw err;
        }
        return json;
      });
    });
  }

  return {
    // Auth
    login: function (login, pass) { return request('login', { login: login, pass: pass }); },
    logout: function () { return request('logout', {}); },
    session: function () { return request('session'); },

    // Users
    usersList: function () { return request('users.list'); },
    usersSave: function (data) { return request('users.save', data); },
    usersDelete: function (id) { return request('users.delete', { id: id }); },
    usersToggle: function (id) { return request('users.toggle', { id: id }); },

    // Profile
    profileGet: function () { return request('profile.get'); },
    profileSave: function (data) { return request('profile.save', data); },

    // Settings
    settingsGet: function () { return request('settings.get'); },
    settingsSave: function (data) { return request('settings.save', data); },

    // Content (sidebar, about, contact)
    contentGet: function (type) { return request(type + '.get'); },
    contentSave: function (type, data) { return request(type + '.save', data); },

    // Generic CRUD (services, team, partners, packages, projects)
    list: function (type) { return request(type + '.list'); },
    save: function (type, data) { return request(type + '.save', data); },
    del: function (type, id) { return request(type + '.delete', { id: id }); },

    // Pricing
    pricingList: function () { return request('pricing.list'); },
    pricingSaveCat: function (data) { return request('pricing.saveCat', data); },
    pricingDeleteCat: function (id) { return request('pricing.deleteCat', { id: id }); },
    pricingSaveItem: function (data) { return request('pricing.saveItem', data); },
    pricingDeleteItem: function (id) { return request('pricing.deleteItem', { id: id }); },

    // Advantages
    advantagesList: function () { return request('advantages.list'); },
    advantagesSaveSec: function (data) { return request('advantages.saveSec', data); },
    advantagesDeleteSec: function (id) { return request('advantages.deleteSec', { id: id }); },
    advantagesSaveItem: function (data) { return request('advantages.saveItem', data); },
    advantagesDeleteItem: function (id) { return request('advantages.deleteItem', { id: id }); },

    // Messages
    messagesList: function () { return request('messages.list'); },
    messagesDelete: function () { return request('messages.delete', {}); },
    messagesSubmit: function (data) { return request('messages.submit', data); },

    // Orders
    ordersList: function () { return request('orders.list'); },
    ordersDelete: function () { return request('orders.delete', {}); },
    ordersSubmit: function (data) { return request('orders.submit', data); },

    // Notifications
    notifsList: function () { return request('notifs.list'); },
    notifsMarkRead: function () { return request('notifs.markRead', {}); },
    notifsCount: function () { return request('notifs.count'); },

    // Activity
    activityList: function () { return request('activity.list'); },

    // Dashboard
    dashboardStats: function () { return request('dashboard.stats'); },
    dashboardRecent: function () { return request('dashboard.recent'); },

    // Install
    install: function () { return request('install'); },

    // Public (for frontend)
    publicAll: function () { return request('public.all'); }
  };
})();
