/* Store link solo para drivers: el menú esconde Tienda/Store salvo que la
   sesión sea de una cuenta driver (verificado contra /auth/web/me; el cache
   local evita el parpadeo mientras responde). Riders y visitantes no la ven. */
(function () {
  'use strict';
  var API = 'https://cruiseapp2-production.up.railway.app';

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

  show(cachedRole() === 'driver');

  var tok = '';
  try { tok = localStorage.getItem('vr_at') || ''; } catch (_) {}
  if (!tok) { show(false); return; }

  fetch(API + '/auth/web/me', { headers: { Authorization: 'Bearer ' + tok } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (u) {
      show(!!u && u.role === 'driver');
      if (u) { try { localStorage.setItem('vr_au', JSON.stringify(u)); } catch (_) {} }
    })
    .catch(function () {});
})();
