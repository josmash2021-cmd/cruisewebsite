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

  /* ─────────────────────────── estilos ─────────────────────────── */
  var CSS = ''
    + '.cam-avatar{position:relative;width:42px;height:42px;border-radius:50%;border:none;background:#262b35;color:#f5d77a;font:700 16px/1 Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;box-shadow:inset 1px 1px 3px rgba(255,255,255,.09),inset -4px -4px 8px rgba(0,0,0,.35),0 6px 16px rgba(0,0,0,.4);transition:transform 180ms}'
    + '.cam-avatar:hover{transform:translateY(-1px)}'
    + '.cam-avatar img{width:100%;height:100%;object-fit:cover}'
    + '.cam-wrap{position:relative;display:flex;align-items:center}'
    + '.cam-panel{position:absolute;top:calc(100% + 12px);right:0;width:330px;max-width:calc(100vw - 24px);background:#20242d;border-radius:24px;padding:20px;z-index:9000;opacity:0;visibility:hidden;transform:translateY(-8px) scale(.98);transform-origin:top right;transition:opacity 200ms ease,transform 220ms cubic-bezier(.22,1,.36,1),visibility 200ms;box-shadow:0 26px 60px rgba(0,0,0,.6),inset 0 0 0 1px rgba(212,175,55,.14);font-family:Inter,system-ui,sans-serif}'
    + '.cam-panel.is-open{opacity:1;visibility:visible;transform:none}'
    + '.cam-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}'
    + '.cam-name{margin:0;font:800 22px/1.15 Cinzel,Georgia,serif;color:#fff;letter-spacing:-.3px;word-break:break-word}'
    + '.cam-face{flex:0 0 auto;width:54px;height:54px;border-radius:50%;background:#262b35;color:#f5d77a;display:flex;align-items:center;justify-content:center;font:700 20px/1 Inter,system-ui,sans-serif;overflow:hidden;box-shadow:inset 4px 4px 10px rgba(0,0,0,.45),inset 0 0 0 1.5px rgba(212,175,55,.3)}'
    + '.cam-face img{width:100%;height:100%;object-fit:cover}'
    + '.cam-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}'
    + '.cam-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 6px;background:#262b35;border:none;border-radius:16px;color:#eceef2;font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;box-shadow:inset 1px 1px 3px rgba(255,255,255,.08),inset -3px -3px 7px rgba(0,0,0,.32);transition:transform 160ms}'
    + '.cam-tile:hover{transform:translateY(-2px)}'
    + '.cam-tile svg{color:#f5d77a}'
    + '.cam-cash{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px;background:#262b35;border-radius:16px;margin-bottom:6px;box-shadow:inset 1px 1px 3px rgba(255,255,255,.08),inset -3px -3px 7px rgba(0,0,0,.32)}'
    + '.cam-cash span{font:600 14px/1 Inter,system-ui,sans-serif;color:#eceef2}'
    + '.cam-cash b{font:800 20px/1 Inter,system-ui,sans-serif;color:#fff}'
    + '.cam-row{display:flex;align-items:center;gap:16px;width:100%;padding:16px 6px;background:none;border:none;color:#eceef2;font:600 15px/1 Inter,system-ui,sans-serif;text-align:left;text-decoration:none;cursor:pointer;transition:opacity 160ms}'
    + '.cam-row+.cam-row{box-shadow:inset 0 1px 0 rgba(255,255,255,.07)}'
    + '.cam-row:hover{opacity:.75}'
    + '.cam-row svg{flex:0 0 auto;color:#f5d77a}'
    + '.cam-out{width:100%;margin-top:10px;padding:16px;background:#262b35;border:none;border-radius:16px;color:#ff6b6b;font:700 15px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:inset 1px 1px 3px rgba(255,255,255,.08),inset -3px -3px 7px rgba(0,0,0,.32)}'
    + '.cam-out:hover{color:#ff8585}'
    + '.cam-promo{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(0,0,0,.66)}'
    + '.cam-promo.is-open{display:flex}'
    + '.cam-promo__box{width:100%;max-width:380px;background:#20242d;border-radius:24px;padding:24px;font-family:Inter,system-ui,sans-serif;box-shadow:0 26px 60px rgba(0,0,0,.6),inset 0 0 0 1px rgba(212,175,55,.14)}'
    + '.cam-promo__title{margin:0 0 18px;font:800 20px/1.2 Cinzel,Georgia,serif;color:#fff}'
    + '.cam-promo__label{display:block;margin:0 0 8px;font:600 13px/1 Inter,system-ui,sans-serif;color:#eceef2}'
    + '.cam-promo__input{width:100%;padding:15px 16px;background:#17191f;border:none;border-radius:16px;color:#fff;font:600 15px/1 Inter,system-ui,sans-serif;outline:none;box-shadow:inset 6px 6px 12px rgba(0,0,0,.48),inset -3px -3px 8px rgba(255,255,255,.05)}'
    + '.cam-promo__input:focus{box-shadow:inset 6px 6px 12px rgba(0,0,0,.48),inset 0 0 0 1.5px rgba(212,175,55,.45)}'
    + '.cam-promo__input::placeholder{color:rgba(236,238,242,.38)}'
    + '.cam-promo__msg{min-height:18px;margin:8px 2px 0;font:600 12px/1.4 Inter,system-ui,sans-serif;color:#ff6b6b}'
    + '.cam-promo__msg.is-ok{color:#7ddc9a}'
    + '.cam-promo__apply{margin-top:14px;padding:12px 24px;background:#262b35;border:none;border-radius:999px;color:#eceef2;font:700 14px/1 Inter,system-ui,sans-serif;cursor:pointer;box-shadow:inset 1px 1px 3px rgba(255,255,255,.08),inset -3px -3px 7px rgba(0,0,0,.32)}'
    + '.cam-promo__go{display:block;width:100%;margin-top:18px;padding:16px;border:none;border-radius:18px;background:linear-gradient(145deg,#f2d577,#d4af37 55%,#b8922c);color:#241c05;font:800 15px/1 Inter,system-ui,sans-serif;text-align:center;text-decoration:none;cursor:pointer;box-shadow:8px 8px 18px rgba(0,0,0,.42),-6px -6px 14px rgba(255,255,255,.09)}'
    + '.cam-promo__close{display:block;width:100%;margin-top:10px;padding:12px;background:none;border:none;color:rgba(255,255,255,.6);font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:underline;cursor:pointer}'
    + '@media (max-width:520px){.cam-panel{position:fixed;top:auto;bottom:0;right:0;left:0;width:auto;max-width:none;border-radius:26px 26px 0 0;transform:translateY(16px)}.cam-panel.is-open{transform:none}}';

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
    var photo = u && (u.photo_url || u.avatar_url || u.photo);
    var face = photo ? '<img src="' + photo + '" alt="">' : initial(u);
    return ''
      + '<div class="cam-panel" data-cam-panel role="menu">'
      + '  <div class="cam-head">'
      + '    <h2 class="cam-name">' + esc(fullName(u)) + '</h2>'
      + '    <span class="cam-face">' + face + '</span>'
      + '  </div>'
      + '  <div class="cam-tiles">'
      + '    <a class="cam-tile" href="' + WA + '" target="_blank" rel="noopener">' + ICO.help + T.help + '</a>'
      + '    <a class="cam-tile" href="' + BASE + 'wallet.html">' + ICO.wallet + T.wallet + '</a>'
      + '    <a class="cam-tile" href="' + BASE + 'profile.html">' + ICO.activity + T.activity + '</a>'
      + '  </div>'
      + '  <div class="cam-cash"><span>' + T.cash + '</span><b data-cam-balance>$0.00</b></div>'
      + '  <a class="cam-row" href="' + BASE + 'account.html">' + ICO.manage + T.manage + '</a>'
      + '  <button type="button" class="cam-row" data-cam-promos>' + ICO.promos + T.promos + '</button>'
      + '  <a class="cam-row" href="' + BASE + 'account.html#legal">' + ICO.legal + T.legal + '</a>'
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
    var photo = u && (u.photo_url || u.avatar_url || u.photo);
    wrap.innerHTML = ''
      + '<button type="button" class="cam-avatar" data-cam-toggle aria-haspopup="true" aria-expanded="false" aria-label="' + T.account + '">'
      + (photo ? '<img src="' + photo + '" alt="">' : initial(u))
      + '</button>'
      + buildPanel(u);

    var burger = actions.querySelector('.ch-burger');
    if (burger) actions.insertBefore(wrap, burger); else actions.appendChild(wrap);

    document.body.insertAdjacentHTML('beforeend', buildPromo());

    var panel = wrap.querySelector('[data-cam-panel]');
    var toggle = wrap.querySelector('[data-cam-toggle]');
    var promo = document.querySelector('[data-cam-promo]');

    function open(v) {
      panel.classList.toggle('is-open', v);
      toggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      open(!panel.classList.contains('is-open'));
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) open(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { open(false); if (promo) promo.classList.remove('is-open'); }
    });

    var signout = panel.querySelector('[data-cam-signout]');
    if (signout) signout.addEventListener('click', function () {
      try {
        localStorage.removeItem('vr_at');
        localStorage.removeItem('vr_au');
        localStorage.removeItem('vr_active_booking');
      } catch (_) {}
      location.href = BASE || './';
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
