/* Store link solo para drivers + guardián de sesión de toda la web. */
(function () {
  'use strict';
  var API = 'https://cruiseapp2-production.up.railway.app';
  var TERMINAL = {
    blocked: true,
    deleted: true,
    deactivated: true,
    pending_deletion: true,
    account_revoked: true
  };
  var redirecting = false;

  function els() { return document.querySelectorAll('[data-store-link]'); }
  function show(v) {
    els().forEach(function (a) { a.style.display = v ? '' : 'none'; });
  }
  function cachedRole() {
    try {
      var u = JSON.parse(localStorage.getItem('vr_au') || 'null');
      return u && u.role;
    } catch (_) { return null; }
  }
  function token() {
    try { return localStorage.getItem('vr_at') || ''; } catch (_) { return ''; }
  }
  function forceLogout() {
    if (redirecting) return;
    redirecting = true;
    try {
      localStorage.removeItem('vr_at');
      localStorage.removeItem('vr_au');
      localStorage.removeItem('vr_photo_local');
    } catch (_) {}
    location.replace(/^\/en(\/|$)/.test(location.pathname) ? '/en/auth' : '/auth');
  }
  function isTerminal(u) {
    return !!u && TERMINAL[String(u.status || '').toLowerCase()] === true;
  }

  function check() {
    if (redirecting) return;
    var tok = token();
    if (!tok) { show(false); return; }
    fetch(API + '/auth/web/me', { headers: { Authorization: 'Bearer ' + tok } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403 || r.status === 404) {
          forceLogout();
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(function (u) {
        if (!u) return;
        if (isTerminal(u)) {
          forceLogout();
          return;
        }
        show(u.role === 'driver');
        try { localStorage.setItem('vr_au', JSON.stringify(u)); } catch (_) {}
      })
      .catch(function () {});
  }

  show(cachedRole() === 'driver');
  check();
  setInterval(check, 5000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) check();
  });
  window.addEventListener('pageshow', check);
})();
