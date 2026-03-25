/* ========================================
   АндСофт Админ Panel JavaScript
   DB-ONLY MODE: Бүх өгөгдлийг MySQL-ээс
   уншиж, MySQL-д хадгалдаг.
   ======================================== */
(function () {
  'use strict';

  const P = 'andsoft_admin_';

  // ======== IN-MEMORY DATA CACHE ========
  var DB = {
    sidebar: {}, about: {}, contact: {},
    services: [], team: [], partners: [],
    pricing: [], packages: [], advantages: [],
    projects: [], messages: [], orders: [],
    settings: { soundEnabled: true, autoRefresh: true, sidebarCollapsed: false },
    profile: { name: 'Админ', avatar: '' },
    users: [], notifs: [], activity: []
  };

  // ======== HELPERS ========
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function $(id) { return document.getElementById(id); }

  function toast(msg, type) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.remove('error');
    if (type === 'error') t.classList.add('error');
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show', 'error'); }, type === 'error' ? 5000 : 2500);
  }

  // ======== API HELPER ========
  function api(action, data) {
    if (typeof BACKEND === 'undefined') {
      return Promise.reject(new Error('Backend холбогдоогүй.'));
    }
    return BACKEND.api(action, data);
  }

  // ======== AUTH ========
  function isLogged() { return sessionStorage.getItem(P + 'session') === 'true'; }
  function getSessionUser() {
    try { return JSON.parse(sessionStorage.getItem(P + 'sessionUser') || 'null'); } catch(e) { return null; }
  }
  function setSessionUser(u) { sessionStorage.setItem(P + 'sessionUser', JSON.stringify(u)); }
  function currentRole() {
    var su = getSessionUser();
    return su ? su.role : 'super';
  }
  function isSuperAdmin() { return currentRole() === 'super'; }

  // ======== LOAD ALL DATA FROM DB ========
  function loadAllData() {
    return api('public.all').then(function (res) {
      var d = res.data || res;
      if (d.sidebar) DB.sidebar = d.sidebar;
      if (d.about) DB.about = d.about;
      if (d.contact) DB.contact = d.contact;
      if (d.services) DB.services = d.services;
      if (d.team) DB.team = d.team;
      if (d.partners) DB.partners = d.partners;
      if (d.pricing) DB.pricing = d.pricing;
      if (d.packages) DB.packages = d.packages;
      if (d.advantages) DB.advantages = d.advantages;
      if (d.projects) DB.projects = d.projects;
      return Promise.all([
        api('messages.list').then(function (r) { if (r.data) DB.messages = r.data; }).catch(function(){}),
        api('orders.list').then(function (r) { if (r.data) DB.orders = r.data; }).catch(function(){}),
        api('notifs.list').then(function (r) { if (r.data) DB.notifs = r.data; }).catch(function(){}),
        api('activity.list').then(function (r) { if (r.data) DB.activity = r.data; }).catch(function(){}),
        api('settings.get').then(function (r) { if (r.data) DB.settings = r.data; }).catch(function(){}),
        api('profile.get').then(function (r) { if (r.data) DB.profile = r.data; }).catch(function(){}),
        api('users.list').then(function (r) { if (r.data) DB.users = r.data; }).catch(function(){})
      ]);
    });
  }

  // ======== SAVE HELPERS ========
  function saveContent(type, data) {
    DB[type] = data;
    console.log('[SAVE] saveContent', type, JSON.stringify(data).substring(0,200));
    return api(type + '.save', data).then(function(r) {
      console.log('[SAVE] saveContent response', type, r);
      if (r && r.error) toast('Алдаа: ' + (r.error || 'Хадгалагдсангүй'), 'error');
    }).catch(function(e) { console.error('[SAVE] saveContent FAIL', type, e); toast('Алдаа: ' + e.message, 'error'); });
  }

  function saveArray(type, data) {
    DB[type] = data;
    console.log('[SAVE] saveArray', type, 'items:', data.length, JSON.stringify(data).substring(0,300));
    return api(type + '.replaceAll', { items: data }).then(function(r) {
      console.log('[SAVE] saveArray response', type, r);
      if (r && r.error) toast('Алдаа: ' + (r.error || 'Хадгалагдсангүй'), 'error');
    }).catch(function(e) { console.error('[SAVE] saveArray FAIL', type, e); toast('Алдаа: ' + e.message, 'error'); });
  }

  function savePricing(data) {
    DB.pricing = data;
    console.log('[SAVE] savePricing', 'categories:', data.length, JSON.stringify(data).substring(0,300));
    return api('pricing.replaceAll', { categories: data }).then(function(r) {
      console.log('[SAVE] savePricing response', r);
      if (r && r.error) toast('Алдаа: ' + (r.error || 'Хадгалагдсангүй'), 'error');
    }).catch(function(e) { console.error('[SAVE] savePricing FAIL', e); toast('Алдаа: ' + e.message, 'error'); });
  }

  function saveAdvantages(data) {
    DB.advantages = data;
    return api('advantages.replaceAll', { sections: data }).catch(function(e) { console.warn('Save advantages:', e.message); });
  }

  // ======== IMAGE/ICON HELPERS ========
  function imgSrc(val) {
    if (!val) return '';
    if (val.startsWith('data:') || val.startsWith('http')) return val;
    return (window.IMAGE_BASE || '/images/') + val;
  }

  function renderIcon(val) {
    if (!val) return '';
    var v = val.trim();
    if (v.startsWith('<svg') || v.startsWith('<SVG')) return v;
    if (v.startsWith('data:') || v.startsWith('http')) return '<img src="' + esc(v) + '" class="icon-img">';
    return '<ion-icon name="' + esc(v) + '"></ion-icon>';
  }

  // ======== FILE UPLOAD HELPER ========
  function resizeImage(file, maxW, maxH, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          var ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(c.toDataURL('image/webp', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function initFileUploads() {
    document.querySelectorAll('input[data-upload-for]').forEach(function (fileInput) {
      fileInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file) return;
        var targetId = this.dataset.uploadFor;
        var target = $(targetId);
        var preview = $(targetId + 'Preview');
        if (file.type === 'image/svg+xml') {
          var r = new FileReader();
          r.onload = function (e) {
            target.value = e.target.result;
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
          };
          r.readAsDataURL(file);
        } else {
          resizeImage(file, 800, 600, function (dataUrl) {
            target.value = dataUrl;
            if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
          });
        }
        this.value = '';
      });
    });
  }

  function showPreview(inputId) {
    var val = $(inputId).value;
    var preview = $(inputId + 'Preview');
    if (!preview) return;
    if (val && (val.startsWith('data:') || val.startsWith('http') || (!val.startsWith('<')))) {
      preview.src = imgSrc(val);
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  }

  // ======== NOTIFICATION SOUND ========
  function playNotifSound() {
    if (!DB.settings.soundEnabled) return;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) { /* ignore */ }
  }

  // ======== ACTIVITY LOG ========
  function logActivity(action, section, item) {
    var act = {
      time: new Date().toISOString(),
      admin: DB.profile.name || 'Админ',
      action: action,
      section: section,
      item: item || ''
    };
    DB.activity.unshift(act);
    if (DB.activity.length > 50) DB.activity.length = 50;
    api('activity.log', act).catch(function(){});
    renderActivity();
  }

  function timeAgo(iso) {
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'Дөнгөж сая';
    if (diff < 3600) return Math.floor(diff / 60) + ' мин';
    if (diff < 86400) return Math.floor(diff / 3600) + ' цаг';
    return Math.floor(diff / 86400) + ' хоног';
  }

  function renderActivity() {
    var act = DB.activity;
    var list = $('notifActivity');
    if (!list) return;
    if (!act.length) { list.innerHTML = '<div class="empty-state"><p>Лог хоосон</p></div>'; return; }
    var at = { add: 'нэмлээ', edit: 'засварлалаа', delete: 'устгалаа' };
    list.innerHTML = act.slice(0, 30).map(function (a) {
      return '<div class="activity-item">' +
        '<div class="activity-icon">' + (a.action === 'add' ? '+' : a.action === 'edit' ? '✎' : '✕') + '</div>' +
        '<div class="activity-text"><strong>' + esc(a.admin) + '</strong> ' + esc(a.section) + ' "' + esc(a.item) + '" ' + (at[a.action] || '') +
        '<span class="notif-time">' + timeAgo(a.time) + '</span></div></div>';
    }).join('');
  }

  // ======== NOTIFICATIONS ========
  var lastMsgCount = 0;
  var lastOrdCount = 0;

  function checkForNew() {
    api('messages.list').then(function(r) {
      if (r.data) {
        var oldLen = DB.messages.length;
        DB.messages = r.data;
        if (r.data.length > oldLen && oldLen > 0) { playNotifSound(); renderMessages(); renderStats(); renderDashRecent(); }
      }
    }).catch(function(){});
    api('orders.list').then(function(r) {
      if (r.data) {
        var oldLen = DB.orders.length;
        DB.orders = r.data;
        if (r.data.length > oldLen && oldLen > 0) { playNotifSound(); renderOrders(); renderStats(); renderDashRecent(); }
      }
    }).catch(function(){});
    renderNotifs();
  }

  function renderNotifs() {
    var notifs = DB.notifs;
    var unread = notifs.filter(function (n) { return !n.read; }).length;
    var badge = $('notifBadge');
    if (badge) {
      if (unread > 0) { badge.textContent = unread > 99 ? '99+' : unread; badge.style.display = ''; }
      else { badge.style.display = 'none'; }
    }
    var list = $('notifAlerts');
    if (!list) return;
    if (!notifs.length) { list.innerHTML = '<div class="empty-state"><p>Мэдэгдэл байхгүй</p></div>'; return; }
    list.innerHTML = notifs.slice(0, 30).map(function (n) {
      return '<div class="notif-item' + (n.read ? '' : ' unread') + '">' +
        '<div class="notif-icon ' + n.type + '">' + (n.type === 'message' ? '✉' : '🛒') + '</div>' +
        '<div class="notif-text">' + esc(n.text) + '<span class="notif-time">' + timeAgo(n.time) + '</span></div></div>';
    }).join('');
  }

  function markNotifsRead() {
    DB.notifs.forEach(function (n) { n.read = true; });
    api('notifs.markRead', {}).catch(function(){});
    renderNotifs();
  }

  // ======== CHARTS ========
  function drawContentChart() {
    var canvas = $('chartContent');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth - 32;
    var h = 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    var data = [
      { label: 'Гишүүд', value: DB.team.length, color: '#60a5fa' },
      { label: 'Төслүүд', value: DB.projects.length, color: '#34d399' },
      { label: 'Үйлчилгээ', value: DB.services.length, color: '#fb923c' },
      { label: 'Хамтрагч', value: DB.partners.length, color: '#a78bfa' },
      { label: 'Багц', value: DB.packages.length, color: '#f472b6' },
      { label: 'Үнэ', value: DB.pricing.reduce(function (s, c) { return s + (c.items || []).length; }, 0), color: '#facc15' },
      { label: 'Мессеж', value: DB.messages.length, color: '#fb7185' },
      { label: 'Захиалга', value: DB.orders.length, color: '#38bdf8' }
    ];

    var max = Math.max.apply(null, data.map(function (d) { return d.value; }));
    if (max === 0) max = 1;
    var barH = 24, gap = 8, labelW = 76;
    var barAreaW = w - labelW - 50;

    ctx.font = '11px Poppins, sans-serif';
    ctx.textBaseline = 'middle';

    data.forEach(function (d, i) {
      var y = i * (barH + gap) + 8;
      ctx.fillStyle = '#8b8fa8';
      ctx.textAlign = 'right';
      ctx.fillText(d.label, labelW - 8, y + barH / 2);
      var bw = Math.max((d.value / max) * barAreaW, 4);
      ctx.fillStyle = d.color;
      ctx.beginPath();
      var r = 4, x = labelW, bh = barH;
      ctx.moveTo(x + r, y); ctx.lineTo(x + bw - r, y);
      ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
      ctx.lineTo(x + bw, y + bh - r);
      ctx.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
      ctx.lineTo(x + r, y + bh);
      ctx.quadraticCurveTo(x, y + bh, x, y + bh - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.fill();
      ctx.fillStyle = '#e4e6f0';
      ctx.textAlign = 'left';
      ctx.fillText(d.value, labelW + bw + 8, y + barH / 2);
    });
  }

  function drawProjectsChart() {
    var canvas = $('chartProjects');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.parentElement.clientWidth - 32;
    var h = 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    var data = [
      { label: 'Хийсэн төсөл', value: DB.projects.filter(function (p) { return p.category === 'project'; }).length, color: '#34d399' },
      { label: 'Бэлэн загвар', value: DB.projects.filter(function (p) { return p.category === 'template'; }).length, color: '#60a5fa' },
      { label: 'Мессеж', value: DB.messages.length, color: '#fb923c' },
      { label: 'Захиалга', value: DB.orders.length, color: '#a78bfa' }
    ];

    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (total === 0) {
      ctx.fillStyle = '#8b8fa8'; ctx.font = '13px Poppins, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('Мэдээлэл байхгүй', w / 2, h / 2);
      return;
    }

    var cx = w / 2, cy = h / 2 - 20;
    var radius = Math.max(Math.min(w, h) / 3, 1);
    var innerR = radius * 0.55;
    var startAngle = -Math.PI / 2;

    data.forEach(function (d) {
      if (d.value === 0) return;
      var sliceAngle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = d.color; ctx.fill();
      startAngle += sliceAngle;
    });

    ctx.fillStyle = '#e4e6f0'; ctx.font = '600 22px Poppins, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy);

    ctx.font = '11px Poppins, sans-serif'; ctx.textBaseline = 'middle';
    var legendY = h - 16;
    var totalLegendW = 0;
    data.forEach(function (d) { totalLegendW += ctx.measureText(d.label + ' (' + d.value + ')').width + 30; });
    var legendX = (w - totalLegendW) / 2;
    data.forEach(function (d) {
      ctx.fillStyle = d.color;
      ctx.fillRect(legendX, legendY - 5, 10, 10);
      ctx.fillStyle = '#8b8fa8'; ctx.textAlign = 'left';
      var txt = d.label + ' (' + d.value + ')';
      ctx.fillText(txt, legendX + 14, legendY);
      legendX += ctx.measureText(txt).width + 30;
    });
  }

  function drawCharts() { drawContentChart(); drawProjectsChart(); }

  // ======== DASHBOARD RECENT ========
  function renderDashRecent() {
    var msgEl = $('dashRecentMessages');
    if (msgEl) {
      var msgs = DB.messages.slice(0, 5);
      if (!msgs.length) { msgEl.innerHTML = '<div class="empty-state"><p>Мессеж байхгүй</p></div>'; }
      else {
        msgEl.innerHTML = msgs.map(function(m) {
          return '<div class="dash-recent-item"><div class="dash-recent-icon msg"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="dash-recent-body"><div class="dash-recent-name">' + esc(m.name || 'Нэргүй') + '</div><div class="dash-recent-text">' + esc((m.message || '').substring(0, 60)) + '</div></div><div class="dash-recent-date">' + esc(m.date || '') + '</div></div>';
        }).join('');
      }
    }
    var ordEl = $('dashRecentOrders');
    if (ordEl) {
      var ords = DB.orders.slice(0, 5);
      if (!ords.length) { ordEl.innerHTML = '<div class="empty-state"><p>Захиалга байхгүй</p></div>'; }
      else {
        ordEl.innerHTML = ords.map(function(o) {
          return '<div class="dash-recent-item"><div class="dash-recent-icon ord"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div><div class="dash-recent-body"><div class="dash-recent-name">' + esc(o.name || 'Нэргүй') + '</div><div class="dash-recent-text">' + esc(o.service || o.phone || '') + '</div></div><div class="dash-recent-date">' + esc(o.date || '') + '</div></div>';
        }).join('');
      }
    }
  }

  // ======== DEFAULT DATA (for initial install) ========
  var defSidebar = { logo: 'AndSoft-Logo.png', subtitle: 'IT Компани', email: 'AndSoftGP@protonmail.com', phone: '9449-6014', address: 'Улаанбаатар, Embassy One бизнес оффис 10 давхарт', facebook: '#', instagram: '#' };
  var defAbout = { text: 'АндСофт Глобал Партнэр компани нь оюутан наснаас эхэлсэн нөхөрлөл, хамтын мөрөөдлөөс төрсөн мэдээлэл технологийн компани юм.', mission: 'Орчин үеийн технологийн шийдлээр дамжуулан байгууллагуудын үйл ажиллагааг хялбарчилж, үр ашигтай болгоход хувь нэмэр оруулах.', vision: 'Мэдээлэл технологид суурилсан, олон салбарыг хамарсан дэлхийн түншлэлийн экосистемийг бүтээх.' };
  var defContact = { email: 'AndSoftGP@protonmail.com', phone: '9449-6014', lat: '47.914678', lng: '106.927123', zoom: 17, popupTitle: 'АндСофт Глобал Партнэр ХХК', popupAddress: 'Embassy One бизнес оффис 10 давхарт' };

  // ======== SVG ICONS ========
  var editSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var delSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>';

  function actionBtns(editFn, delFn) {
    if (!isSuperAdmin()) return '';
    return '<button class="btn-icon" onclick="' + editFn + '" title="Засах">' + editSvg + '</button>' +
           '<button class="btn-icon delete" onclick="' + delFn + '" title="Устгах">' + delSvg + '</button>';
  }

  // ======== RENDER FUNCTIONS ========
  function renderStats() {
    var el;
    el = $('statTeam'); if (el) el.textContent = DB.team.length;
    el = $('statProjects'); if (el) el.textContent = DB.projects.length;
    el = $('statMessages'); if (el) el.textContent = DB.messages.length;
    el = $('statOrders'); if (el) el.textContent = DB.orders.length;
  }

  function loadProfile() {
    var p = DB.profile;
    var nameEl = $('profileName');
    var avatarEl = $('profileAvatar');
    if (nameEl) nameEl.textContent = p.name || 'Админ';
    if (avatarEl) avatarEl.src = p.avatar ? p.avatar : 'images/Logo1.png';
  }

  function loadSidebarForm() {
    var s = DB.sidebar.logo ? DB.sidebar : defSidebar;
    $('sidebarLogo').value = s.logo || '';
    $('sidebarTitle').value = s.subtitle || '';
    $('sidebarEmail').value = s.email || '';
    $('sidebarPhone').value = s.phone || '';
    $('sidebarLocation').value = s.address || '';
    $('sidebarFacebook').value = s.facebook || '';
    $('sidebarInstagram').value = s.instagram || '';
    showPreview('sidebarLogo');
  }

  function loadAboutForm() {
    var a = DB.about.text ? DB.about : defAbout;
    $('aboutText').value = a.text || '';
    $('aboutMission').value = a.mission || '';
    $('aboutVision').value = a.vision || '';
  }

  function renderServices() {
    var tbody = $('servicesTableBody');
    var data = DB.services;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Хоосон</td></tr>'; return; }
    tbody.innerHTML = data.map(function (s, i) {
      return '<tr><td>' + renderIcon(s.icon) + '</td><td>' + esc(s.title) + '</td><td class="desc-cell">' + esc(s.desc) + '</td><td>' + actionBtns('A.editService(' + i + ')', 'A.delService(' + i + ')') + '</td></tr>';
    }).join('');
  }

  function renderTeam() {
    var tbody = $('teamTableBody');
    var data = DB.team;
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">Хоосон</td></tr>'; return; }
    tbody.innerHTML = data.map(function (m, i) {
      return '<tr><td><img src="' + esc(imgSrc(m.image)) + '" class="table-avatar"></td><td>' + esc(m.role) + '</td><td class="desc-cell">' + esc(m.desc) + '</td><td>' + actionBtns('A.editTeam(' + i + ')', 'A.delTeam(' + i + ')') + '</td></tr>';
    }).join('');
  }

  function renderPartners() {
    var grid = $('partnersGrid');
    var data = DB.partners;
    if (!data.length) { grid.innerHTML = '<div class="empty-state"><p>Хоосон</p></div>'; return; }
    grid.innerHTML = data.map(function (p, i) {
      return '<div class="partner-card"><div class="partner-actions">' + actionBtns('A.editPartner(' + i + ')', 'A.delPartner(' + i + ')') + '</div><img src="' + esc(imgSrc(p.logo)) + '" alt="' + esc(p.name) + '"><div class="partner-name">' + esc(p.name) + '</div></div>';
    }).join('');
  }

  function renderPricing() {
    var container = $('pricingContainer');
    var data = DB.pricing;
    if (!data.length) { container.innerHTML = '<div class="empty-state"><p>Хоосон</p></div>'; return; }
    container.innerHTML = data.map(function (cat, ci) {
      var catActions = isSuperAdmin() ?
        '<button class="btn-primary btn-sm" onclick="A.addPricingItem(' + ci + ')">+ Үнэ</button> ' +
        '<button class="btn-icon" onclick="A.editPricingCat(' + ci + ')">' + editSvg + '</button>' +
        '<button class="btn-icon delete" onclick="A.delPricingCat(' + ci + ')">' + delSvg + '</button>' : '';
      return '<div class="pricing-category"><div class="pricing-cat-header"><div class="pricing-cat-title">' + renderIcon(cat.icon) + ' ' + esc(cat.name) + '</div><div>' + catActions + '</div></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Icon</th><th>Гарчиг</th><th>Үнэ</th><th>Тайлбар</th><th>Түгээмэл</th><th>Үйлдэл</th></tr></thead><tbody>' +
        (cat.items || []).map(function (item, ii) {
          return '<tr><td>' + renderIcon(item.icon) + '</td><td>' + esc(item.title) + '</td><td class="price-cell">' + esc(item.price) + '</td><td class="desc-cell">' + esc(item.desc) + '</td><td>' + (item.popular ? '<span class="badge">Түгээмэл</span>' : '') + '</td><td>' + actionBtns('A.editPricingItem(' + ci + ',' + ii + ')', 'A.delPricingItem(' + ci + ',' + ii + ')') + '</td></tr>';
        }).join('') +
        '</tbody></table></div></div>';
    }).join('');
  }

  function renderPackages() {
    var grid = $('packagesGrid');
    var data = DB.packages;
    if (!data.length) { grid.innerHTML = '<div class="empty-state"><p>Хоосон</p></div>'; return; }
    grid.innerHTML = data.map(function (p, i) {
      return '<div class="package-card' + (p.popular ? ' popular' : '') + '"><div class="package-header">' + renderIcon(p.icon) + '<h4>' + esc(p.name) + '</h4>' + (p.popular ? '<span class="badge">Түгээмэл</span>' : '') + '</div><div class="package-price">' + esc(p.price) + '</div><ul class="package-features">' + (p.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul><div class="package-actions">' + actionBtns('A.editPackage(' + i + ')', 'A.delPackage(' + i + ')') + '</div></div>';
    }).join('');
  }

  function renderAdvantages() {
    var container = $('advantagesContainer');
    var data = DB.advantages;
    if (!data.length) { container.innerHTML = '<div class="empty-state"><p>Хоосон</p></div>'; return; }
    container.innerHTML = data.map(function (sec, si) {
      var secActions = isSuperAdmin() ?
        '<button class="btn-primary btn-sm" onclick="A.addAdvItem(' + si + ')">+ Нэмэх</button> ' +
        '<button class="btn-icon" onclick="A.editAdvSection(' + si + ')">' + editSvg + '</button>' +
        '<button class="btn-icon delete" onclick="A.delAdvSection(' + si + ')">' + delSvg + '</button>' : '';
      return '<div class="adv-section"><div class="adv-section-header"><div class="adv-section-title"><span class="adv-number">' + esc(sec.number) + '</span> ' + esc(sec.title) + '</div><div>' + secActions + '</div></div>' +
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Icon</th><th>Гарчиг</th><th>Тайлбар</th><th>Үйлдэл</th></tr></thead><tbody>' +
        (sec.items || []).map(function (item, ii) {
          return '<tr><td>' + renderIcon(item.icon) + '</td><td>' + esc(item.title) + '</td><td class="desc-cell">' + esc(item.desc) + '</td><td>' + actionBtns('A.editAdvItem(' + si + ',' + ii + ')', 'A.delAdvItem(' + si + ',' + ii + ')') + '</td></tr>';
        }).join('') +
        '</tbody></table></div></div>';
    }).join('');
  }

  function renderProjects() {
    var grid = $('projectsGrid');
    var data = DB.projects;
    if (!data.length) { grid.innerHTML = '<div class="empty-state"><p>Хоосон</p></div>'; return; }
    grid.innerHTML = data.map(function (p, i) {
      return '<div class="project-admin-card"><img src="' + esc(imgSrc(p.image)) + '" alt=""><div class="project-admin-info"><h4>' + esc(p.name) + '</h4><p>' + esc(p.shortDesc) + '</p><div class="project-admin-footer"><div>' + (p.tags || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean).map(function (t) { return '<span class="project-tag">' + esc(t) + '</span>'; }).join('') + '</div><div>' + actionBtns('A.editProject(' + i + ')', 'A.delProject(' + i + ')') + '</div></div></div></div>';
    }).join('');
  }

  function loadContactForm() {
    var c = DB.contact.email ? DB.contact : defContact;
    $('contactEmail').value = c.email || '';
    $('contactPhone').value = c.phone || '';
    $('contactLat').value = c.lat || '';
    $('contactLng').value = c.lng || '';
    $('contactZoom').value = c.zoom || 17;
    $('contactPopupTitle').value = c.popupTitle || '';
    $('contactPopupAddress').value = c.popupAddress || '';
  }

  function renderMessages() {
    var container = $('messagesContainer');
    var data = DB.messages;
    if (!data.length) { container.innerHTML = '<div class="empty-state"><p>Мессеж ирээгүй</p></div>'; return; }
    container.innerHTML = data.map(function (m, i) {
      return '<div class="message-card"><div class="message-header"><span class="message-name">' + esc(m.name) + '</span><span class="message-date">' + esc(m.date || '') + '</span></div><div class="message-meta">' + esc(m.email) + (m.phone ? ' • ' + esc(m.phone) : '') + '</div><div class="message-body">' + esc(m.message) + '</div>' + (m.service ? '<span class="message-service">' + esc(m.service) + '</span>' : '') + (isSuperAdmin() ? '<div style="margin-top:8px"><button class="btn-icon delete" onclick="A.delMsg(' + i + ')">' + delSvg + '</button></div>' : '') + '</div>';
    }).join('');
  }

  function renderOrders() {
    var container = $('ordersContainer');
    var data = DB.orders;
    if (!data.length) { container.innerHTML = '<div class="empty-state"><p>Захиалга ирээгүй</p></div>'; return; }
    container.innerHTML = data.map(function (o, i) {
      return '<div class="message-card"><div class="message-header"><span class="message-name">' + esc(o.name) + '</span><span class="message-date">' + esc(o.date || '') + '</span></div><div class="message-meta">' + esc(o.email || '') + (o.phone ? ' • ' + esc(o.phone) : '') + '</div><div class="message-body"><strong>' + esc(o.project) + '</strong><br>' + esc(o.message) + '</div>' + (isSuperAdmin() ? '<div style="margin-top:8px"><button class="btn-icon delete" onclick="A.delOrder(' + i + ')">' + delSvg + '</button></div>' : '') + '</div>';
    }).join('');
  }

  function renderUsers() {
    var tbody = $('usersTableBody');
    if (!tbody) return;
    var users = DB.users;
    var superAdmin = isSuperAdmin();
    var roleName = { super: 'Супер админ', view: 'Үзэх эрх' };
    tbody.innerHTML = users.map(function (u, i) {
      var isFirst = (i === 0);
      var actions = '';
      if (superAdmin) {
        actions = '<button class="btn-icon" onclick="A.editUser(' + i + ')" title="Засах">' + editSvg + '</button>';
        if (!isFirst) {
          actions += '<button class="btn-icon' + (u.status === 'blocked' ? '' : ' delete') + '" onclick="A.toggleBlockUser(' + i + ')" title="' + (u.status === 'blocked' ? 'Блок арилгах' : 'Блоклох') + '">' + (u.status === 'blocked' ? '🔓' : '🔒') + '</button>';
          actions += '<button class="btn-icon delete" onclick="A.delUser(' + i + ')" title="Устгах">' + delSvg + '</button>';
        }
      }
      return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.login) + '</td><td><span class="role-badge ' + u.role + '">' + (roleName[u.role] || u.role) + '</span></td><td><span class="status-badge ' + (u.status === 'blocked' ? 'blocked' : 'active') + '">' + (u.status === 'blocked' ? 'Блоклогдсон' : 'Идэвхтэй') + '</span></td><td>' + actions + '</td></tr>';
    }).join('');
  }

  function loadSettings() {
    var s = DB.settings;
    var soundEl = $('settingSoundToggle');
    var autoEl = $('settingAutoRefresh');
    var sidebarEl = $('settingSidebarCollapsed');
    if (soundEl) soundEl.checked = s.soundEnabled !== false;
    if (autoEl) autoEl.checked = s.autoRefresh !== false;
    if (sidebarEl) sidebarEl.checked = !!s.sidebarCollapsed;
  }

  function applyRoleRestrictions() {
    var viewOnly = !isSuperAdmin();
    document.querySelectorAll('#addServiceBtn,#addTeamBtn,#addPartnerBtn,#addPricingCatBtn,#addPackageBtn,#addAdvSectionBtn,#addProjectBtn,#addUserBtn,#clearMessagesBtn,#clearOrdersBtn,#resetDataBtn,#exportDataBtn').forEach(function (b) { b.style.display = viewOnly ? 'none' : ''; });
    document.querySelectorAll('#sidebarForm .btn-primary,#aboutForm .btn-primary,#contactForm .btn-primary').forEach(function (b) { b.style.display = viewOnly ? 'none' : ''; });
    var usersNav = document.querySelector('[data-section="users"]');
    if (usersNav) usersNav.style.display = viewOnly ? 'none' : '';
    document.querySelectorAll('#sidebarForm input,#sidebarForm textarea,#aboutForm input,#aboutForm textarea,#contactForm input,#contactForm textarea').forEach(function (inp) { inp.readOnly = viewOnly; });
  }

  function renderAll() {
    renderStats(); loadProfile(); loadSidebarForm(); loadAboutForm();
    renderServices(); renderTeam(); renderPartners(); renderPricing();
    renderPackages(); renderAdvantages(); renderProjects(); loadContactForm();
    renderMessages(); renderOrders(); renderNotifs(); renderActivity();
    renderDashRecent(); renderUsers(); loadSettings(); applyRoleRestrictions();
    setTimeout(drawCharts, 100);
  }

  // ======== MODAL HELPERS ========
  function openModal(id) { $(id).classList.add('active'); }
  function closeModal(id) { $(id).classList.remove('active'); }

  // ======== SIDEBAR COLLAPSE ========
  function applySidebarState() {
    if (DB.settings.sidebarCollapsed) document.body.classList.add('sidebar-collapsed');
    else document.body.classList.remove('sidebar-collapsed');
  }

  function toggleSidebar() {
    var collapsed = !document.body.classList.contains('sidebar-collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    DB.settings.sidebarCollapsed = collapsed;
    api('settings.save', DB.settings).catch(function(){});
    setTimeout(drawCharts, 300);
  }

  // ======== INIT ========
  function init() {
    var loginScreen = $('loginScreen');
    var adminPanel = $('adminPanel');

    // Check existing session
    if (isLogged()) {
      loginScreen.style.display = 'none';
      adminPanel.style.display = 'flex';
      api('session').then(function(res) {
        if (res && res.logged) {
          return loadAllData().then(function() {
            applySidebarState();
            initPanel();
          });
        } else {
          sessionStorage.removeItem(P + 'session');
          location.reload();
        }
      }).catch(function() {
        sessionStorage.removeItem(P + 'session');
        location.reload();
      });
      return;
    }

    $('loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('loginUser').value.trim();
      var p = $('loginPass').value;
      $('loginError').textContent = '';

      api('login', { login: u, pw: p }).then(function (res) {
        var user = res.data || res.user || res;
        sessionStorage.setItem(P + 'session', 'true');
        setSessionUser({ name: user.name || 'Админ', login: u, role: user.role || 'super' });
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'flex';
        loadAllData().then(function() {
          applySidebarState();
          initPanel();
        }).catch(function() { initPanel(); });
      }).catch(function (err) {
        $('loginError').textContent = err.message || 'Нэвтрэх нэр эсвэл нууц үг буруу';
      });
    });
  }

  function initPanel() {
    renderAll();
    initFileUploads();
    lastMsgCount = DB.messages.length;
    lastOrdCount = DB.orders.length;

    setInterval(function () { if (DB.settings.autoRefresh !== false) checkForNew(); }, 10000);

    var navItems = document.querySelectorAll('.nav-item[data-section]');
    var sections = document.querySelectorAll('.content-section');
    var sidebar = $('adminSidebar');

    navItems.forEach(function (btn) {
      btn.addEventListener('click', function () {
        navItems.forEach(function (n) { n.classList.remove('active'); });
        this.classList.add('active');
        var sec = this.dataset.section;
        sections.forEach(function (s) { s.classList.toggle('active', s.dataset.content === sec); });
        $('headerTitle').textContent = this.querySelector('span').textContent;
        sidebar.classList.remove('open');
        if (sec === 'dashboard') { setTimeout(drawCharts, 100); renderDashRecent(); }
      });
    });

    $('menuToggle').addEventListener('click', function () { sidebar.classList.toggle('open'); });
    $('sidebarCollapseBtn').addEventListener('click', toggleSidebar);

    function doLogout() {
      api('logout', {}).catch(function(){});
      sessionStorage.removeItem(P + 'session');
      sessionStorage.removeItem(P + 'sessionUser');
      location.reload();
    }
    $('logoutBtn').addEventListener('click', doLogout);
    $('headerLogoutBtn').addEventListener('click', doLogout);

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(this.dataset.closeModal); });
    });
    document.querySelectorAll('.modal-overlay').forEach(function (ov) {
      ov.addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });
    });

    $('profileBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      $('profileDropdown').classList.toggle('active');
      $('notifDropdown').classList.remove('active');
    });
    $('notifBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      $('notifDropdown').classList.toggle('active');
      $('profileDropdown').classList.remove('active');
      markNotifsRead();
    });
    document.addEventListener('click', function () {
      $('profileDropdown').classList.remove('active');
      $('notifDropdown').classList.remove('active');
    });
    $('notifDropdown').addEventListener('click', function (e) { e.stopPropagation(); });

    document.querySelectorAll('.notif-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.notif-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var which = this.dataset.ntab;
        $('notifAlerts').style.display = which === 'alerts' ? '' : 'none';
        $('notifActivity').style.display = which === 'activity' ? '' : 'none';
      });
    });

    // === Profile edit ===
    $('editProfileBtn').addEventListener('click', function () {
      $('profileDropdown').classList.remove('active');
      var p = DB.profile;
      var su = getSessionUser();
      $('profileEditName').value = p.name || 'Админ';
      $('profileEditUser').value = su ? su.login : '';
      $('profileEditPass').value = '';
      var roleName = { super: 'Супер админ', view: 'Үзэх эрх' };
      var rd = $('profileRoleDisplay');
      if (rd) rd.innerHTML = '<span class="role-badge ' + currentRole() + '">' + (roleName[currentRole()] || currentRole()) + '</span>';
      var avatar = $('profileEditAvatar');
      avatar.src = p.avatar ? p.avatar : 'images/Logo1.png';
      openModal('profileModal');
    });
    $('profileAvatarInput').addEventListener('change', function () {
      var file = this.files[0]; if (!file) return;
      resizeImage(file, 200, 200, function (dataUrl) { $('profileEditAvatar').src = dataUrl; });
      this.value = '';
    });
    $('profileForm').addEventListener('submit', function (e) {
      e.preventDefault();
      DB.profile.name = $('profileEditName').value.trim() || 'Админ';
      var avatarSrc = $('profileEditAvatar').src;
      if (avatarSrc && avatarSrc.startsWith('data:')) DB.profile.avatar = avatarSrc;
      api('profile.save', DB.profile).catch(function(){});
      var su = getSessionUser();
      if (su) { su.name = DB.profile.name; setSessionUser(su); }
      loadProfile();
      closeModal('profileModal');
      toast('Профайл хадгалагдлаа');
    });

    // === SIDEBAR FORM ===
    $('sidebarForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var data = { logo: $('sidebarLogo').value, subtitle: $('sidebarTitle').value, email: $('sidebarEmail').value, phone: $('sidebarPhone').value, address: $('sidebarLocation').value, facebook: $('sidebarFacebook').value, instagram: $('sidebarInstagram').value };
      saveContent('sidebar', data);
      logActivity('edit', 'Цэс', 'Sidebar');
      toast('Цэс хадгалагдлаа');
    });

    // === ABOUT FORM ===
    $('aboutForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      saveContent('about', { text: $('aboutText').value, mission: $('aboutMission').value, vision: $('aboutVision').value });
      logActivity('edit', 'Танилцуулга', 'About');
      toast('Танилцуулга хадгалагдлаа');
    });

    // === SERVICES ===
    $('addServiceBtn').addEventListener('click', function () {
      $('serviceModalTitle').textContent = 'Нэмэх';
      $('serviceForm').reset(); $('serviceEditIndex').value = '-1';
      openModal('serviceModal');
    });
    $('serviceForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('serviceEditIndex').value;
      var item = { icon: $('serviceIcon').value, title: $('serviceTitle').value, desc: $('serviceDesc').value };
      if (idx >= 0) { DB.services[idx] = item; } else { DB.services.push(item); }
      saveArray('services', DB.services);
      renderServices(); closeModal('serviceModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Үйлчилгээ', item.title);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ');
    });

    // === TEAM ===
    $('addTeamBtn').addEventListener('click', function () {
      $('teamModalTitle').textContent = 'Нэмэх';
      $('teamForm').reset(); $('teamEditIndex').value = '-1';
      var preview = $('teamImagePreview'); if (preview) preview.style.display = 'none';
      openModal('teamModal');
    });
    $('teamForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('teamEditIndex').value;
      var item = { role: $('teamRole').value, desc: $('teamDesc').value, image: $('teamImage').value || 'avatar-1.png' };
      if (idx >= 0) { DB.team[idx] = item; } else { DB.team.push(item); }
      saveArray('team', DB.team);
      renderTeam(); renderStats(); closeModal('teamModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Хамт олон', item.role);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ'); drawCharts();
    });

    // === PARTNERS ===
    $('addPartnerBtn').addEventListener('click', function () {
      $('partnerModalTitle').textContent = 'Нэмэх';
      $('partnerForm').reset(); $('partnerEditIndex').value = '-1';
      var preview = $('partnerLogoPreview'); if (preview) preview.style.display = 'none';
      openModal('partnerModal');
    });
    $('partnerForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('partnerEditIndex').value;
      var item = { name: $('partnerName').value, logo: $('partnerLogo').value, url: $('partnerUrl').value };
      if (idx >= 0) { DB.partners[idx] = item; } else { DB.partners.push(item); }
      saveArray('partners', DB.partners);
      renderPartners(); closeModal('partnerModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Хамтрагч', item.name);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ'); drawCharts();
    });

    // === PRICING CATEGORY ===
    $('addPricingCatBtn').addEventListener('click', function () {
      $('pricingCatModalTitle').textContent = 'Ангилал нэмэх';
      $('pricingCatForm').reset(); $('pricingCatEditIndex').value = '-1';
      openModal('pricingCatModal');
    });
    $('pricingCatForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('pricingCatEditIndex').value;
      if (idx >= 0) { DB.pricing[idx].name = $('pricingCatName').value; DB.pricing[idx].icon = $('pricingCatIcon').value; }
      else { DB.pricing.push({ name: $('pricingCatName').value, icon: $('pricingCatIcon').value, items: [] }); }
      savePricing(DB.pricing);
      renderPricing(); closeModal('pricingCatModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Үнийн ангилал', $('pricingCatName').value);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ');
    });

    // === PRICING ITEM ===
    $('pricingItemForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var ci = +$('pricingItemCatIndex').value;
      var ii = +$('pricingItemEditIndex').value;
      var item = { icon: $('pricingItemIcon').value, title: $('pricingItemTitle').value, price: $('pricingItemPrice').value, desc: $('pricingItemDesc').value, popular: $('pricingItemPopular').checked };
      if (ii >= 0) { DB.pricing[ci].items[ii] = item; } else { DB.pricing[ci].items.push(item); }
      savePricing(DB.pricing);
      renderPricing(); closeModal('pricingItemModal');
      logActivity(ii >= 0 ? 'edit' : 'add', 'Үнэ', item.title);
      toast(ii >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ'); drawCharts();
    });

    // === PACKAGES ===
    $('addPackageBtn').addEventListener('click', function () {
      $('packageModalTitle').textContent = 'Багц нэмэх';
      $('packageForm').reset(); $('packageEditIndex').value = '-1';
      openModal('packageModal');
    });
    $('packageForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('packageEditIndex').value;
      var item = { name: $('packageName').value, icon: $('packageIcon').value, price: $('packagePrice').value, popular: $('packagePopular').checked, features: $('packageFeatures').value.split('\n').map(function (f) { return f.trim(); }).filter(Boolean) };
      if (idx >= 0) { DB.packages[idx] = item; } else { DB.packages.push(item); }
      saveArray('packages', DB.packages);
      renderPackages(); closeModal('packageModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Багц', item.name);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ'); drawCharts();
    });

    // === ADVANTAGE SECTION ===
    $('addAdvSectionBtn').addEventListener('click', function () {
      $('advSectionModalTitle').textContent = 'Хэсэг нэмэх';
      $('advSectionForm').reset(); $('advSectionEditIndex').value = '-1';
      openModal('advSectionModal');
    });
    $('advSectionForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('advSectionEditIndex').value;
      if (idx >= 0) { DB.advantages[idx].number = $('advSectionNumber').value; DB.advantages[idx].title = $('advSectionTitle').value; }
      else { DB.advantages.push({ number: $('advSectionNumber').value, title: $('advSectionTitle').value, items: [] }); }
      saveAdvantages(DB.advantages);
      renderAdvantages(); closeModal('advSectionModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Давуу тал', $('advSectionTitle').value);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ');
    });

    // === ADVANTAGE ITEM ===
    $('advItemForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var si = +$('advItemSecIndex').value;
      var ii = +$('advItemEditIndex').value;
      var item = { icon: $('advItemIcon').value, title: $('advItemTitle').value, desc: $('advItemDesc').value };
      if (ii >= 0) { DB.advantages[si].items[ii] = item; } else { DB.advantages[si].items.push(item); }
      saveAdvantages(DB.advantages);
      renderAdvantages(); closeModal('advItemModal');
      logActivity(ii >= 0 ? 'edit' : 'add', 'Давуу тал', item.title);
      toast(ii >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ');
    });

    // === PROJECTS ===
    $('addProjectBtn').addEventListener('click', function () {
      $('projectModalTitle').textContent = 'Нэмэх';
      $('projectForm').reset(); $('projectEditIndex').value = '-1';
      var preview = $('projectImagePreview'); if (preview) preview.style.display = 'none';
      openModal('projectModal');
    });
    $('projectForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var idx = +$('projectEditIndex').value;
      var item = { name: $('projectName').value, shortDesc: $('projectShortDesc').value, desc: $('projectDesc').value, image: $('projectImage').value || 'project-2.png', category: $('projectCategory').value, tags: $('projectTags').value, price: $('projectPrice').value };
      if (idx >= 0) { DB.projects[idx] = item; } else { DB.projects.push(item); }
      saveArray('projects', DB.projects);
      renderProjects(); renderStats(); closeModal('projectModal');
      logActivity(idx >= 0 ? 'edit' : 'add', 'Төсөл', item.name);
      toast(idx >= 0 ? 'Засагдлаа' : 'Нэмэгдлээ'); drawCharts();
    });

    // === CONTACT ===
    $('contactForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      saveContent('contact', { email: $('contactEmail').value, phone: $('contactPhone').value, lat: $('contactLat').value, lng: $('contactLng').value, zoom: +$('contactZoom').value || 17, popupTitle: $('contactPopupTitle').value, popupAddress: $('contactPopupAddress').value });
      logActivity('edit', 'Холбоо барих', 'Contact');
      toast('Холбоо барих хадгалагдлаа');
    });

    // === MESSAGES / ORDERS ===
    $('clearMessagesBtn').addEventListener('click', function () {
      if (confirm('Бүх мессежийг устгах уу?')) {
        api('messages.delete', {}).then(function() {
          DB.messages = []; lastMsgCount = 0;
          renderMessages(); renderStats(); drawCharts(); renderDashRecent(); toast('Устгагдлаа');
        }).catch(function(){ toast('Алдаа гарлаа'); });
      }
    });
    $('clearOrdersBtn').addEventListener('click', function () {
      if (confirm('Бүх захиалгыг устгах уу?')) {
        api('orders.delete', {}).then(function() {
          DB.orders = []; lastOrdCount = 0;
          renderOrders(); renderStats(); drawCharts(); renderDashRecent(); toast('Устгагдлаа');
        }).catch(function(){ toast('Алдаа гарлаа'); });
      }
    });

    // === SETTINGS TOGGLES ===
    var settingsEl = { sound: $('settingSoundToggle'), auto: $('settingAutoRefresh'), sidebar: $('settingSidebarCollapsed') };
    function saveSettingsLocal() {
      DB.settings = { soundEnabled: settingsEl.sound ? settingsEl.sound.checked : true, autoRefresh: settingsEl.auto ? settingsEl.auto.checked : true, sidebarCollapsed: settingsEl.sidebar ? settingsEl.sidebar.checked : false };
      api('settings.save', DB.settings).catch(function(){});
    }
    if (settingsEl.sound) settingsEl.sound.addEventListener('change', function () { saveSettingsLocal(); toast(this.checked ? 'Дуу асаалаа' : 'Дуу унтраалаа'); });
    if (settingsEl.auto) settingsEl.auto.addEventListener('change', function () { saveSettingsLocal(); toast(this.checked ? 'Автомат шинэчлэлт асаалаа' : 'Автомат шинэчлэлт унтраалаа'); });
    if (settingsEl.sidebar) settingsEl.sidebar.addEventListener('change', function () { saveSettingsLocal(); });

    // === USERS CRUD ===
    if ($('addUserBtn')) {
      $('addUserBtn').addEventListener('click', function () {
        if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
        $('userModalTitle').textContent = 'Хэрэглэгч нэмэх';
        $('userForm').reset(); $('userEditIndex').value = '-1';
        $('userPass').placeholder = 'Нууц үг'; $('userPass').required = true;
        openModal('userModal');
      });
    }
    if ($('userForm')) {
      $('userForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
        var idx = parseInt($('userEditIndex').value);
        var login = $('userLogin').value.trim();
        var pass = $('userPass').value;
        var name = $('userName').value.trim();
        var role = $('userRole').value;
        for (var i = 0; i < DB.users.length; i++) {
          if (DB.users[i].login === login && i !== idx) { toast('Нэвтрэх нэр давхцаж байна'); return; }
        }
        var userData = { name: name, login: login, role: role };
        if (pass) userData.pw = pass;
        if (idx >= 0) {
          userData.id = DB.users[idx].id;
          logActivity('edit', 'Эрх', name);
        } else {
          if (!pass) { toast('Нууц үг оруулна уу'); return; }
          userData.status = 'active';
          logActivity('add', 'Эрх', name);
        }
        api('users.save', userData).then(function() {
          return api('users.list');
        }).then(function(r) {
          if (r.data) DB.users = r.data;
          renderUsers(); closeModal('userModal'); toast('Хадгалагдлаа');
        }).catch(function(err) { toast(err.message || 'Алдаа'); });
      });
    }

    // === DATA EXPORT/IMPORT ===
    $('exportDataBtn').addEventListener('click', function () {
      var data = { sidebar: DB.sidebar, about: DB.about, services: DB.services, team: DB.team, partners: DB.partners, pricing: DB.pricing, packages: DB.packages, advantages: DB.advantages, projects: DB.projects, contact: DB.contact, messages: DB.messages, orders: DB.orders };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'andsoft-data-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click(); URL.revokeObjectURL(a.href); toast('Экспортлогдлоо');
    });

    $('importDataInput').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var d = JSON.parse(ev.target.result);
          var promises = [];
          if (d.sidebar) promises.push(saveContent('sidebar', d.sidebar));
          if (d.about) promises.push(saveContent('about', d.about));
          if (d.contact) promises.push(saveContent('contact', d.contact));
          if (d.services) promises.push(saveArray('services', d.services));
          if (d.team) promises.push(saveArray('team', d.team));
          if (d.partners) promises.push(saveArray('partners', d.partners));
          if (d.packages) promises.push(saveArray('packages', d.packages));
          if (d.projects) promises.push(saveArray('projects', d.projects));
          if (d.pricing) promises.push(savePricing(d.pricing));
          if (d.advantages) promises.push(saveAdvantages(d.advantages));
          Promise.all(promises).then(function() {
            renderAll(); toast('Импортлогдлоо');
          });
        } catch (err) { toast('Файл уншихад алдаа'); }
      };
      reader.readAsText(file); this.value = '';
    });

    $('resetDataBtn').addEventListener('click', function () {
      if (confirm('Бүх датаг устгах уу?')) {
        Promise.all([
          saveContent('sidebar', defSidebar),
          saveContent('about', defAbout),
          saveContent('contact', defContact),
          saveArray('services', []),
          saveArray('team', []),
          saveArray('partners', []),
          saveArray('packages', []),
          saveArray('projects', []),
          savePricing([]),
          saveAdvantages([])
        ]).then(function() {
          DB.messages = []; DB.orders = [];
          lastMsgCount = 0; lastOrdCount = 0;
          renderAll(); toast('Анхны утгууд ачааллаа');
        });
      }
    });

    window.addEventListener('resize', function () { setTimeout(drawCharts, 200); });
  }

  // ======== PUBLIC API ========
  window.A = {
    editService: function (i) {
      var d = DB.services[i]; if (!d) return;
      $('serviceModalTitle').textContent = 'Засах';
      $('serviceIcon').value = d.icon; $('serviceTitle').value = d.title; $('serviceDesc').value = d.desc;
      $('serviceEditIndex').value = i; openModal('serviceModal');
    },
    delService: function (i) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.services[i].title; DB.services.splice(i, 1);
      saveArray('services', DB.services);
      renderServices(); logActivity('delete', 'Үйлчилгээ', name); toast('Устгагдлаа');
    },

    editTeam: function (i) {
      var d = DB.team[i]; if (!d) return;
      $('teamModalTitle').textContent = 'Засах';
      $('teamRole').value = d.role; $('teamDesc').value = d.desc; $('teamImage').value = d.image;
      $('teamEditIndex').value = i; showPreview('teamImage'); openModal('teamModal');
    },
    delTeam: function (i) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.team[i].role; DB.team.splice(i, 1);
      saveArray('team', DB.team);
      renderTeam(); renderStats(); logActivity('delete', 'Хамт олон', name); toast('Устгагдлаа'); drawCharts();
    },

    editPartner: function (i) {
      var d = DB.partners[i]; if (!d) return;
      $('partnerModalTitle').textContent = 'Засах';
      $('partnerName').value = d.name; $('partnerLogo').value = d.logo; $('partnerUrl').value = d.url || '';
      $('partnerEditIndex').value = i; showPreview('partnerLogo'); openModal('partnerModal');
    },
    delPartner: function (i) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.partners[i].name; DB.partners.splice(i, 1);
      saveArray('partners', DB.partners);
      renderPartners(); logActivity('delete', 'Хамтрагч', name); toast('Устгагдлаа'); drawCharts();
    },

    editPricingCat: function (i) {
      var d = DB.pricing[i]; if (!d) return;
      $('pricingCatModalTitle').textContent = 'Засах';
      $('pricingCatName').value = d.name; $('pricingCatIcon').value = d.icon;
      $('pricingCatEditIndex').value = i; openModal('pricingCatModal');
    },
    delPricingCat: function (i) {
      if (!confirm('Бүх зүйлтэй нь устгах уу?')) return;
      var name = DB.pricing[i].name; DB.pricing.splice(i, 1);
      savePricing(DB.pricing);
      renderPricing(); logActivity('delete', 'Үнийн ангилал', name); toast('Устгагдлаа');
    },

    addPricingItem: function (ci) {
      $('pricingItemModalTitle').textContent = 'Үнэ нэмэх';
      $('pricingItemForm').reset(); $('pricingItemCatIndex').value = ci; $('pricingItemEditIndex').value = '-1';
      openModal('pricingItemModal');
    },
    editPricingItem: function (ci, ii) {
      var d = DB.pricing[ci].items[ii]; if (!d) return;
      $('pricingItemModalTitle').textContent = 'Засах';
      $('pricingItemIcon').value = d.icon; $('pricingItemTitle').value = d.title;
      $('pricingItemPrice').value = d.price; $('pricingItemDesc').value = d.desc;
      $('pricingItemPopular').checked = !!d.popular;
      $('pricingItemCatIndex').value = ci; $('pricingItemEditIndex').value = ii;
      openModal('pricingItemModal');
    },
    delPricingItem: function (ci, ii) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.pricing[ci].items[ii].title; DB.pricing[ci].items.splice(ii, 1);
      savePricing(DB.pricing);
      renderPricing(); logActivity('delete', 'Үнэ', name); toast('Устгагдлаа'); drawCharts();
    },

    editPackage: function (i) {
      var d = DB.packages[i]; if (!d) return;
      $('packageModalTitle').textContent = 'Засах';
      $('packageName').value = d.name; $('packageIcon').value = d.icon;
      $('packagePrice').value = d.price; $('packagePopular').checked = !!d.popular;
      $('packageFeatures').value = (d.features || []).join('\n');
      $('packageEditIndex').value = i; openModal('packageModal');
    },
    delPackage: function (i) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.packages[i].name; DB.packages.splice(i, 1);
      saveArray('packages', DB.packages);
      renderPackages(); logActivity('delete', 'Багц', name); toast('Устгагдлаа'); drawCharts();
    },

    editAdvSection: function (i) {
      var d = DB.advantages[i]; if (!d) return;
      $('advSectionModalTitle').textContent = 'Засах';
      $('advSectionNumber').value = d.number; $('advSectionTitle').value = d.title;
      $('advSectionEditIndex').value = i; openModal('advSectionModal');
    },
    delAdvSection: function (i) {
      if (!confirm('Бүх зүйлтэй нь устгах уу?')) return;
      var name = DB.advantages[i].title; DB.advantages.splice(i, 1);
      saveAdvantages(DB.advantages);
      renderAdvantages(); logActivity('delete', 'Давуу тал', name); toast('Устгагдлаа');
    },

    addAdvItem: function (si) {
      $('advItemModalTitle').textContent = 'Нэмэх';
      $('advItemForm').reset(); $('advItemSecIndex').value = si; $('advItemEditIndex').value = '-1';
      openModal('advItemModal');
    },
    editAdvItem: function (si, ii) {
      var d = DB.advantages[si].items[ii]; if (!d) return;
      $('advItemModalTitle').textContent = 'Засах';
      $('advItemIcon').value = d.icon; $('advItemTitle').value = d.title; $('advItemDesc').value = d.desc;
      $('advItemSecIndex').value = si; $('advItemEditIndex').value = ii;
      openModal('advItemModal');
    },
    delAdvItem: function (si, ii) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.advantages[si].items[ii].title; DB.advantages[si].items.splice(ii, 1);
      saveAdvantages(DB.advantages);
      renderAdvantages(); logActivity('delete', 'Давуу тал', name); toast('Устгагдлаа');
    },

    editProject: function (i) {
      var d = DB.projects[i]; if (!d) return;
      $('projectModalTitle').textContent = 'Засах';
      $('projectName').value = d.name; $('projectShortDesc').value = d.shortDesc;
      $('projectDesc').value = d.desc; $('projectImage').value = d.image;
      $('projectCategory').value = d.category; $('projectTags').value = d.tags; $('projectPrice').value = d.price || '';
      $('projectEditIndex').value = i; showPreview('projectImage'); openModal('projectModal');
    },
    delProject: function (i) {
      if (!confirm('Устгах уу?')) return;
      var name = DB.projects[i].name; DB.projects.splice(i, 1);
      saveArray('projects', DB.projects);
      renderProjects(); renderStats(); logActivity('delete', 'Төсөл', name); toast('Устгагдлаа'); drawCharts();
    },

    delMsg: function (i) {
      if (!confirm('Устгах уу?')) return;
      DB.messages.splice(i, 1); lastMsgCount = DB.messages.length;
      renderMessages(); renderStats(); drawCharts(); renderDashRecent(); toast('Устгагдлаа');
    },
    delOrder: function (i) {
      if (!confirm('Устгах уу?')) return;
      DB.orders.splice(i, 1); lastOrdCount = DB.orders.length;
      renderOrders(); renderStats(); drawCharts(); renderDashRecent(); toast('Устгагдлаа');
    },

    editUser: function (i) {
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      var u = DB.users[i]; if (!u) return;
      $('userModalTitle').textContent = 'Хэрэглэгч засах';
      $('userName').value = u.name; $('userLogin').value = u.login;
      $('userPass').value = ''; $('userPass').placeholder = 'Хоосон бол хэвээрээ'; $('userPass').required = false;
      $('userRole').value = u.role;
      $('userEditIndex').value = i;
      openModal('userModal');
    },
    delUser: function (i) {
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      if (i === 0) { toast('Үндсэн админыг устгах боломжгүй'); return; }
      if (!confirm('Устгах уу?')) return;
      var name = DB.users[i].name;
      var userId = DB.users[i].id;
      api('users.delete', { id: userId }).then(function() {
        DB.users.splice(i, 1);
        renderUsers(); logActivity('delete', 'Эрх', name); toast('Устгагдлаа');
      }).catch(function(err) { toast(err.message || 'Алдаа'); });
    },
    toggleBlockUser: function (i) {
      if (!isSuperAdmin()) { toast('Эрх хүрэлцэхгүй'); return; }
      if (i === 0) { toast('Үндсэн админыг блоклох боломжгүй'); return; }
      var userId = DB.users[i].id;
      api('users.toggle', { id: userId }).then(function() {
        DB.users[i].status = DB.users[i].status === 'blocked' ? 'active' : 'blocked';
        renderUsers();
        logActivity('edit', 'Эрх', DB.users[i].name + ' → ' + (DB.users[i].status === 'blocked' ? 'Блоклогдсон' : 'Идэвхтэй'));
        toast(DB.users[i].status === 'blocked' ? 'Блоклогдлоо' : 'Блок арилгалаа');
      }).catch(function(err) { toast(err.message || 'Алдаа'); });
    }
  };

  init();
})();
