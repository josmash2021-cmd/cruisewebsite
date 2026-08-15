/* ── Escudo de contenido (pedido del dueño, 2026-08-14): sin zoom por
   teclado/rueda/gestos, sin copiar/seleccionar fuera de los campos de
   texto, sin clic derecho, sin arrastrar imágenes, y disuasión de
   DevTools (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S). Los screenshots NO
   se pueden bloquear desde una web; la consola solo se disuade. ── */
(function () {
  'use strict';
  try {
    var st = document.createElement('style');
    st.textContent =
      'body{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}' +
      'input,textarea,select,[contenteditable="true"]{-webkit-user-select:text;-moz-user-select:text;user-select:text}' +
      'img,video{-webkit-user-drag:none}';
    document.head.appendChild(st);
  } catch (_) {}
  function inField(e) { var t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  document.addEventListener('copy', function (e) { if (!inField(e)) e.preventDefault(); });
  document.addEventListener('cut', function (e) { if (!inField(e)) e.preventDefault(); });
  addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (n) {
    document.addEventListener(n, function (e) { e.preventDefault(); });
  });
  /* Pinch-zoom en teléfonos: iOS ignora el user-scalable=no del viewport y
     Android a veces deja pasar el primer toque — se corta cualquier gesto de
     dos dedos (tocar y mover). Un dedo solo sigue funcionando normal. */
  document.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    var c = e.ctrlKey || e.metaKey;
    if (c && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) { e.preventDefault(); return; }
    if (e.key === 'F12') { e.preventDefault(); return; }
    if (c && e.shiftKey && ['I', 'J', 'C', 'K'].indexOf(e.key.toUpperCase()) >= 0) { e.preventDefault(); return; }
    if (c && !e.shiftKey && ['u', 's'].indexOf(e.key.toLowerCase()) >= 0 && !inField(e)) { e.preventDefault(); }
  });
  try {
    console.log('%cCruiseInRide', 'font-size:18px;font-weight:bold;color:#d4af37');
    console.log('%cEsta consola es solo para desarrolladores. El contenido de este sitio está protegido; no pegues aquí código que no entiendas.',
      'font-size:12px;color:#999');
  } catch (_) {}
})();

/* ══════════════════════════════════════════════════════════════════
   CruiseInRide — menú de cuenta de la barra superior (estilo Uber)
   Compartido por index / book / contact / 404 / auth / profile (ES y EN).
   Si hay sesión (vr_at) sustituye "Iniciar sesión / Registrarse" por el
   avatar con el panel desplegable. Se autoinyecta el CSS.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EN = (document.documentElement.lang || 'es').toLowerCase().indexOf('en') === 0;
  var BASE = EN ? '../en/' : '';
  var WA = 'https://wa.me/16593052974';

  var T = EN ? {
    help: 'Help', wallet: 'Wallet', activity: 'Activity',
    cash: 'Cruise Cash', manage: 'Manage account', promos: 'Promotions',
    legal: 'Legal', signout: 'Sign out', account: 'Account',
    promoTitle: 'Promotions', promoLabel: 'Promo Code', promoPh: 'Enter a promo',
    apply: 'Apply', seePrices: 'See prices', close: 'Close',
    promoOk: 'Promo code saved. It will be applied to your next ride.',
    promoBad: 'Enter a promo code.',
    legalSoon: 'The legal documents will be available soon.'
  } : {
    help: 'Ayuda', wallet: 'Cartera', activity: 'Actividad',
    cash: 'Saldo Cruise', manage: 'Gestionar cuenta', promos: 'Promociones',
    legal: 'Legal', signout: 'Cerrar sesión', account: 'Cuenta',
    promoTitle: 'Promociones', promoLabel: 'Código promocional', promoPh: 'Escribe un código',
    apply: 'Aplicar', seePrices: 'Ver precios', close: 'Cerrar',
    promoOk: 'Código guardado. Se aplicará en tu próximo viaje.',
    promoBad: 'Escribe un código promocional.',
    legalSoon: 'Los documentos legales estarán disponibles en breve.'
  };

  function user() {
    try { var u = localStorage.getItem('vr_au'); return u ? JSON.parse(u) : null; } catch (_) { return null; }
  }
  /* La copia local (vr_photo_local) manda: la deja la subida más reciente hecha
     en este navegador, con cache-buster, así el cambio se ve al instante aunque
     el backend devuelva siempre la misma URL (que el navegador cachea). */
  /* Solo se aceptan URLs https:// o data:image/: cualquier otra cosa que llegue
     del backend o de localStorage se descarta y se muestran las iniciales. */
  function safePhoto(p) {
    p = String(p || '');
    return (/^https:\/\//i.test(p) || /^data:image\//i.test(p)) ? p : '';
  }
  function photoOf(u) {
    try { var l = localStorage.getItem('vr_photo_local'); if (l) return safePhoto(l); } catch (_) {}
    return safePhoto(u && (u.photo_url || u.avatar_url || u.photo));
  }
  function token() {
    try { return localStorage.getItem('vr_at') || ''; } catch (_) { return ''; }
  }
  function fullName(u) {
    if (!u) return T.account;
    var n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
    return n || u.name || u.full_name || u.email || u.phone || T.account;
  }
  function initial(u) {
    var n = fullName(u);
    return (n || 'C').trim().charAt(0).toUpperCase();
  }

  /* ── estilos (minimalista: superficies planas, bordes finos, dorado solo
        como acento; sin relieves claymórficos) ── */
  var CSS = ''
    + '.cam-avatar{position:relative;width:40px;height:40px;border-radius:50%;border:1px solid rgba(212,175,55,.4);background:#14171c;color:#f5d77a;font:600 15px/1 Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;transition:border-color 160ms}'
    + '.cam-avatar:hover{border-color:rgba(212,175,55,.8)}'
    + '.cam-avatar img{width:100%;height:100%;object-fit:cover}'
    + '.cam-wrap{position:relative;display:flex;align-items:center}'
    + '.cam-panel{position:absolute;top:calc(100% + 10px);right:0;width:300px;max-width:calc(100vw - 24px);background:#0e1116;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;z-index:9000;opacity:0;visibility:hidden;transform:translateY(-6px);transform-origin:top right;transition:opacity 160ms ease,transform 180ms ease,visibility 160ms;box-shadow:0 18px 44px rgba(0,0,0,.55);font-family:Inter,system-ui,sans-serif}'
    + '.cam-panel.is-open{opacity:1;visibility:visible;transform:none}'
    + '.cam-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}'
    + '.cam-name{margin:0;font:700 18px/1.2 Cinzel,Georgia,serif;color:#fff;letter-spacing:.2px;word-break:break-word}'
    + '.cam-face{flex:0 0 auto;width:44px;height:44px;border-radius:50%;background:#14171c;border:1px solid rgba(212,175,55,.35);color:#f5d77a;display:flex;align-items:center;justify-content:center;font:600 17px/1 Inter,system-ui,sans-serif;overflow:hidden}'
    + '.cam-face img{width:100%;height:100%;object-fit:cover}'
    + '.cam-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}'
    + '.cam-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px 6px;background:none;border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#eceef2;font:500 12px/1 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;transition:border-color 160ms}'
    + '.cam-tile:hover{border-color:rgba(212,175,55,.5)}'
    + '.cam-tile svg{color:#f5d77a}'
    + '.cam-cash{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 2px;background:none;border-top:1px solid rgba(255,255,255,.07);margin-bottom:0}'
    + '.cam-cash span{font:500 14px/1 Inter,system-ui,sans-serif;color:rgba(236,238,242,.75)}'
    + '.cam-cash b{font:600 15px/1 Inter,system-ui,sans-serif;color:#fff}'
    + '.cam-row{display:flex;align-items:center;gap:14px;width:100%;padding:13px 2px;background:none;border:none;border-top:1px solid rgba(255,255,255,.07);color:#eceef2;font:500 14px/1 Inter,system-ui,sans-serif;text-align:left;text-decoration:none;cursor:pointer;transition:color 160ms}'
    + '.cam-row:hover{color:#f5d77a}'
    + '.cam-row svg{flex:0 0 auto;color:#f5d77a;opacity:.9}'
    + '.cam-out{display:block;width:100%;margin-top:0;padding:13px 2px;background:none;border:none;border-top:1px solid rgba(255,255,255,.07);border-radius:0;color:#ff6b6b;font:500 14px/1 Inter,system-ui,sans-serif;text-align:left;cursor:pointer;transition:color 160ms}'
    + '.cam-out:hover{color:#ff8585}'
    + '.cam-promo{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.66)}'
    + '.cam-promo.is-open{display:flex}'
    + '.cam-promo__box{width:100%;max-width:360px;background:#0e1116;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px;font-family:Inter,system-ui,sans-serif;box-shadow:0 18px 44px rgba(0,0,0,.55)}'
    + '.cam-promo__title{margin:0 0 16px;font:700 18px/1.2 Cinzel,Georgia,serif;color:#fff}'
    + '.cam-promo__label{display:block;margin:0 0 8px;font:500 13px/1 Inter,system-ui,sans-serif;color:rgba(236,238,242,.75)}'
    + '.cam-promo__input{width:100%;padding:13px 14px;background:none;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font:500 15px/1 Inter,system-ui,sans-serif;outline:none;transition:border-color 160ms}'
    + '.cam-promo__input:focus{border-color:rgba(212,175,55,.6)}'
    + '.cam-promo__input::placeholder{color:rgba(236,238,242,.35)}'
    + '.cam-promo__msg{min-height:18px;margin:8px 2px 0;font:500 12px/1.4 Inter,system-ui,sans-serif;color:#ff6b6b}'
    + '.cam-promo__msg.is-ok{color:#7ddc9a}'
    + '.cam-promo__apply{margin-top:12px;padding:12px 24px;background:none;border:1px solid rgba(255,255,255,.15);border-radius:999px;color:#eceef2;font:600 14px/1 Inter,system-ui,sans-serif;cursor:pointer;transition:border-color 160ms,color 160ms}'
    + '.cam-promo__apply:hover{border-color:rgba(212,175,55,.6);color:#f5d77a}'
    + '.cam-promo__go{display:block;width:100%;margin-top:16px;padding:14px;border:none;border-radius:12px;background:#d4af37;color:#1a1405;font:700 14px/1 Inter,system-ui,sans-serif;text-align:center;text-decoration:none;cursor:pointer;transition:background 160ms}'
    + '.cam-promo__go:hover{background:#f5d77a}'
    + '.cam-promo__close{display:block;width:100%;margin-top:10px;padding:12px;background:none;border:none;color:rgba(255,255,255,.6);font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}'
    + '@media (max-width:520px){.cam-panel{position:fixed;top:auto;bottom:0;right:0;left:0;width:auto;max-width:none;border-radius:26px 26px 0 0;transform:translateY(16px)}.cam-panel.is-open{transform:none}}'
    /* pastilla Actividad + flechita junto al avatar (como la referencia, solo escritorio) */
    + '.cam-activity{display:inline-flex;align-items:center;gap:8px;margin-right:12px;padding:9px 16px;border-radius:999px;background:none;border:1px solid rgba(255,255,255,.15);color:#eceef2;font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:none;transition:border-color 160ms,color 160ms}'
    + '.cam-activity:hover{border-color:rgba(212,175,55,.5);color:#f5d77a}'
    + '.cam-activity svg{color:#f5d77a}'
    + '.cam-chevbtn{display:flex;align-items:center;background:none;border:none;color:#eceef2;cursor:pointer;padding:4px 2px;margin-left:2px}'
    + '.cam-chevbtn:hover{color:#f5d77a}'
    + '@media (max-width:768px){.cam-activity,.cam-chevbtn{display:none}}'
    /* panel a pantalla completa (menú de las 3 rayitas en reservar) */
    + '.cam-panel.is-full{position:fixed;inset:0;top:0;bottom:0;left:0;right:0;width:auto;max-width:none;height:100dvh;border-radius:0;transform:none;overflow-y:auto;z-index:99999;padding:26px 22px 34px}'
    + '.cam-close{position:absolute;top:18px;right:18px;width:40px;height:40px;border-radius:50%;background:none;border:1px solid rgba(255,255,255,.15);color:#fff;font:600 16px/1 Inter,system-ui,sans-serif;cursor:pointer;display:none;align-items:center;justify-content:center}'
    + '.cam-panel.is-full .cam-close{display:flex}';

  function injectCSS() {
    if (document.getElementById('cam-style')) return;
    var s = document.createElement('style');
    s.id = 'cam-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ─────────────────────────── iconos ─────────────────────────── */
  var ICO = {
    help: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M14.5 9.5l3-3M9.5 9.5l-3-3M14.5 14.5l3 3M9.5 14.5l-3 3"/></svg>',
    wallet: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 7a2 2 0 012-2h11a2 2 0 012 2v1"/><rect x="3" y="7" width="18" height="12" rx="2.5"/><circle cx="17" cy="13" r="1.4" fill="currentColor" stroke="none"/></svg>',
    activity: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>',
    manage: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/></svg>',
    promos: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.6 12.4l-8.2 8.2a2 2 0 01-2.8 0l-6.2-6.2a2 2 0 01-.6-1.4V4.5A1.5 1.5 0 014.3 3h8.5a2 2 0 011.4.6l6.4 6.4a2 2 0 010 2.4z"/><circle cx="7.8" cy="7.8" r="1.3" fill="currentColor" stroke="none"/></svg>',
    legal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/></svg>'
  };

  /* ─────────────────────────── panel ─────────────────────────── */
  function buildPanel(u) {
    var photo = photoOf(u);
    var face = photo ? '<img src="' + esc(photo) + '" alt="">' : initial(u);
    return ''
      + '<div class="cam-panel" data-cam-panel role="menu">'
      + '  <div class="cam-head">'
      + '    <h2 class="cam-name">' + esc(fullName(u)) + '</h2>'
      + '    <span class="cam-face">' + face + '</span>'
      + '  </div>'
      + '  <div class="cam-tiles">'
      + '    <a class="cam-tile" href="' + WA + '" target="_blank" rel="noopener">' + ICO.help + T.help + '</a>'
      + '    <a class="cam-tile" href="' + BASE + 'wallet">' + ICO.wallet + T.wallet + '</a>'
      + '    <a class="cam-tile" href="' + BASE + 'profile">' + ICO.activity + T.activity + '</a>'
      + '  </div>'
      + '  <a class="cam-row" href="' + BASE + 'account">' + ICO.manage + T.manage + '</a>'
      + '  <a class="cam-row" href="' + BASE + 'account#legal">' + ICO.legal + T.legal + '</a>'
      + '  <button type="button" class="cam-out" data-cam-signout>' + T.signout + '</button>'
      + '</div>';
  }

  function buildPromo() {
    return ''
      + '<div class="cam-promo" data-cam-promo>'
      + '  <div class="cam-promo__box" role="dialog" aria-modal="true">'
      + '    <h2 class="cam-promo__title">' + T.promoTitle + '</h2>'
      + '    <label class="cam-promo__label" for="camPromoInput">' + T.promoLabel + '</label>'
      + '    <input id="camPromoInput" class="cam-promo__input" type="text" placeholder="' + T.promoPh + '" data-cam-promo-input autocomplete="off">'
      + '    <p class="cam-promo__msg" data-cam-promo-msg></p>'
      + '    <button type="button" class="cam-promo__apply" data-cam-promo-apply>' + T.apply + '</button>'
      + '    <a class="cam-promo__go" href="' + BASE + 'book">' + T.seePrices + '</a>'
      + '    <button type="button" class="cam-promo__close" data-cam-promo-close>' + T.close + '</button>'
      + '  </div>'
      + '</div>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ─────────────────────────── arranque ─────────────────────────── */
  function init() {
    var actions = document.querySelector('.ch-actions');
    if (!actions) return;
    if (!token()) return; // sin sesión: se queda "Iniciar sesión / Registrarse"

    injectCSS();

    var u = user();
    var login = actions.querySelector('.ch-login');
    var signup = actions.querySelector('.ch-signup');
    if (login) login.remove();
    if (signup) signup.remove();

    var wrap = document.createElement('div');
    wrap.className = 'cam-wrap';
    var photo = photoOf(u);
    wrap.innerHTML = ''
      /* pastilla Actividad (escritorio), como la referencia */
      + '<a class="cam-activity" href="' + BASE + 'profile"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/></svg>' + T.activity + '</a>'
      + '<button type="button" class="cam-avatar" data-cam-toggle aria-haspopup="true" aria-expanded="false" aria-label="' + T.account + '">'
      + (photo ? '<img src="' + esc(photo) + '" alt="">' : initial(u))
      + '</button>'
      /* flechita que también abre el panel */
      + '<button type="button" class="cam-chevbtn" data-cam-chev aria-label="' + T.account + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>'
      + buildPanel(u);

    var burger = actions.querySelector('.ch-burger');
    if (burger) actions.insertBefore(wrap, burger); else actions.appendChild(wrap);

    document.body.insertAdjacentHTML('beforeend', buildPromo());

    var panel = wrap.querySelector('[data-cam-panel]');
    var toggle = wrap.querySelector('[data-cam-toggle]');
    var promo = document.querySelector('[data-cam-promo]');

    function open(v) {
      panel.classList.toggle('is-open', v);
      if (!v) panel.classList.remove('is-full');
      toggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      open(!panel.classList.contains('is-open'));
    });
    var chev = wrap.querySelector('[data-cam-chev]');
    if (chev) chev.addEventListener('click', function (e) {
      e.stopPropagation();
      open(!panel.classList.contains('is-open'));
    });
    /* ✕ para el modo pantalla completa */
    var closeX = document.createElement('button');
    closeX.type = 'button'; closeX.className = 'cam-close'; closeX.textContent = '✕';
    closeX.setAttribute('aria-label', T.close);
    closeX.addEventListener('click', function () { open(false); });
    panel.appendChild(closeX);
    /* en la página de reservar, las 3 rayitas abren este panel a pantalla
       completa (como la referencia) en vez del menú normal */
    var isBook = /\/book(\.html)?$/.test(location.pathname.replace(/\/(pickup|dropoff)$/, ''));
    if (isBook && burger) {
      burger.onclick = null; burger.removeAttribute('onclick');
      burger.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        document.body.classList.remove('ch-open');
        panel.classList.add('is-full');
        open(true);
      });
    }
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) open(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { open(false); if (promo) promo.classList.remove('is-open'); }
    });

    var signout = panel.querySelector('[data-cam-signout]');
    if (signout) signout.addEventListener('click', function () {
      /* cierra todo rastro de la sesión: cualquier clave vr_* (vr_at, vr_au,
         vr_photo_local, vr_promo, vr_active_booking, etc.) */
      try {
        var del = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('vr_') === 0) del.push(k);
        }
        del.forEach(function (k) { localStorage.removeItem(k); });
      } catch (_) {}
      location.href = BASE || './';
    });

    /* Refresco en vivo del avatar: cuando cualquier página sube una foto emite
       'vr:photo-updated' (misma pestaña) y el cambio de vr_photo_local dispara
       'storage' en las demás pestañas abiertas. */
    function refreshPhoto(src) {
      if (!src) return;
      [wrap.querySelector('.cam-avatar'), panel.querySelector('.cam-face')].forEach(function (el) {
        if (!el) return;
        var img = document.createElement('img');
        img.src = src; img.alt = '';
        el.textContent = '';
        el.appendChild(img);
      });
    }
    window.addEventListener('vr:photo-updated', function (e) {
      refreshPhoto((e.detail && e.detail.src) || photoOf(user()));
    });
    window.addEventListener('storage', function (e) {
      if (e.key === 'vr_photo_local' && e.newValue) refreshPhoto(e.newValue);
    });

    var promosBtn = panel.querySelector('[data-cam-promos]');
    if (promosBtn && promo) {
      var input = promo.querySelector('[data-cam-promo-input]');
      var msg = promo.querySelector('[data-cam-promo-msg]');
      promosBtn.addEventListener('click', function () {
        open(false);
        promo.classList.add('is-open');
        if (msg) { msg.textContent = ''; msg.classList.remove('is-ok'); }
        if (input) setTimeout(function () { input.focus(); }, 60);
      });
      promo.addEventListener('click', function (e) {
        if (e.target === promo) promo.classList.remove('is-open');
      });
      var closeBtn = promo.querySelector('[data-cam-promo-close]');
      if (closeBtn) closeBtn.addEventListener('click', function () { promo.classList.remove('is-open'); });
      var applyBtn = promo.querySelector('[data-cam-promo-apply]');
      if (applyBtn) applyBtn.addEventListener('click', function () {
        var code = (input ? input.value : '').trim().toUpperCase();
        if (!code) { msg.textContent = T.promoBad; msg.classList.remove('is-ok'); return; }
        try { localStorage.setItem('vr_promo', code); } catch (_) {}
        msg.textContent = T.promoOk;
        msg.classList.add('is-ok');
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
