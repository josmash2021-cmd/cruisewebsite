/* Cruise Store — lógica de la tienda de drivers.
   Guard: sin sesión → auth?return=store; rol != driver → vista bloqueada.
   Los precios SIEMPRE vienen del backend (/store/products); el checkout
   recalcula todo en el servidor, la página solo manda ids + cantidades. */
(function () {
  'use strict';

  var root = document.getElementById('cruise-store');
  if (!root) return;

  var EN = root.getAttribute('data-lang') === 'en';
  var API = root.getAttribute('data-api-base');
  var APIKEY = root.getAttribute('data-api-key') || '';

  var T = EN ? {
    loginTitle: 'Cruise Store',
    loginMsg: 'Sign in with your driver account to see the store.',
    loginCta: 'Sign in',
    blockedTitle: 'Cruise Store',
    blockedMsg: 'This session belongs to a rider account. Sign in with your driver account to see the store.',
    pay: 'Pay with Stripe',
    paying: 'Redirecting to Stripe…',
    errNet: 'Connection error — try again.',
    errCard: 'Enter your name and phone number to personalize the cards.',
    errShip: 'Complete the shipping address.',
    errItems: 'Pick at least one product.',
    successTitle: 'Order confirmed!',
    successMsg: 'Your payment went through. We will produce your merch and ship it to the address you gave us. You will receive a confirmation email.',
    pendingMsg: 'The payment is not confirmed yet. If you already paid, it will clear in a few seconds — refresh this page.',
    cancelMsg: 'Payment cancelled — your order was not charged. You can try again whenever you want.',
    shipTo: 'Shipping address'
  } : {
    loginTitle: 'Tienda Cruise',
    loginMsg: 'Inicia sesión con tu cuenta de driver para ver la tienda.',
    loginCta: 'Iniciar sesión',
    blockedTitle: 'Tienda Cruise',
    blockedMsg: 'Esta sesión es de una cuenta de pasajero. Entra con tu cuenta de driver para ver la tienda.',
    pay: 'Pagar con Stripe',
    paying: 'Redirigiendo a Stripe…',
    errNet: 'Error de conexión — inténtalo de nuevo.',
    errCard: 'Escribe tu nombre y teléfono para personalizar las tarjetas.',
    errShip: 'Completa la dirección de envío.',
    errItems: 'Elige al menos un producto.',
    successTitle: '¡Pedido confirmado!',
    successMsg: 'Tu pago se procesó correctamente. Produciremos tu mercancía y la enviaremos a la dirección que indicaste. Recibirás un correo de confirmación.',
    pendingMsg: 'El pago aún no está confirmado. Si ya pagaste, se acredita en unos segundos — recarga esta página.',
    cancelMsg: 'Pago cancelado — tu pedido no fue cobrado. Puedes intentarlo de nuevo cuando quieras.',
    shipTo: 'Dirección de envío'
  };

  function token() { try { return localStorage.getItem('vr_at') || ''; } catch (_) { return ''; } }

  function api(path, opts) {
    opts = opts || {};
    var h = { 'Content-Type': 'application/json' };
    if (APIKEY) h['X-API-Key'] = APIKEY;
    if (token()) h['Authorization'] = 'Bearer ' + token();
    if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
    return fetch(API + path, { method: opts.method || 'GET', headers: h, body: opts.body })
      .then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) { var e = new Error(d && d.detail || ('HTTP ' + r.status)); e.status = r.status; throw e; }
          return d;
        });
      });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"']/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function money(cents) { return '$' + (cents / 100).toFixed(2); }

  /* ── vistas ── */
  var views = {
    gate: document.getElementById('store-gate'),
    blocked: document.getElementById('store-blocked'),
    shop: document.getElementById('store-shop'),
    success: document.getElementById('store-success'),
    cancelled: document.getElementById('store-cancelled')
  };
  function show(v) {
    Object.keys(views).forEach(function (k) { if (views[k]) views[k].hidden = k !== v; });
    if (views[v]) window.scrollTo(0, 0);
  }

  /* ── estado ── */
  var catalog = {};   // id -> {price_cents, name, customizable}
  var qty = {};       // id -> int
  var orderBusy = false;

  /* ── preview de la tarjeta (en vivo) ── */
  var inName = document.getElementById('bc-first');
  var inLast = document.getElementById('bc-last');
  var inPhone = document.getElementById('bc-phone');
  var pvName = document.getElementById('bc-pv-name');
  var pvPhone = document.getElementById('bc-pv-phone');

  /* Máscara (000) 000-0000 mientras escribe; acepta 1 inicial -> +1 (...) */
  function maskPhone(v) {
    var d = (v || '').replace(/\D/g, '');
    var p = '';
    if (d.length > 10 && d.charAt(0) === '1') { p = '+1 '; d = d.slice(1); }
    d = d.slice(0, 10);
    if (!d.length) return p;
    var out = '(' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 10);
    return p + out;
  }

  function renderPreview() {
    if (!pvName) return;
    var n = ((inName.value || '') + ' ' + (inLast.value || '')).trim();
    pvName.textContent = n || (EN ? 'YOUR NAME' : 'TU NOMBRE');
    pvPhone.textContent = (inPhone.value || '').trim() || '(000) 000-0000';
  }
  [inName, inLast].forEach(function (el) {
    if (el) el.addEventListener('input', renderPreview);
  });
  if (inPhone) inPhone.addEventListener('input', function () {
    inPhone.value = maskPhone(inPhone.value);
    renderPreview();
  });

  /* flip frente/dorso — tabs + tocar la tarjeta */
  var tabs = document.querySelectorAll('[data-face]');
  var flip = document.getElementById('bc-flip');
  function setFace(f) {
    if (!flip) return;
    flip.classList.toggle('flipped', f === 'back');
    tabs.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-face') === f); });
  }
  tabs.forEach(function (b) {
    b.addEventListener('click', function () { setFace(b.getAttribute('data-face')); });
  });
  if (flip) {
    flip.addEventListener('click', function () {
      setFace(flip.classList.contains('flipped') ? 'front' : 'back');
    });
    flip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFace(flip.classList.contains('flipped') ? 'front' : 'back');
      }
    });
  }

  /* ── catálogo ── */
  function bindCatalog() {
    document.querySelectorAll('[data-product]').forEach(function (card) {
      var id = card.getAttribute('data-product');
      var qEl = card.querySelector('[data-qty]');
      card.querySelectorAll('[data-qty-btn]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var d = btn.getAttribute('data-qty-btn') === 'plus' ? 1 : -1;
          qty[id] = Math.min(20, Math.max(0, (qty[id] || 0) + d));
          qEl.textContent = qty[id];
          renderSummary();
        });
      });
    });
  }

  function renderSummary() {
    var box = document.getElementById('order-lines');
    var totalEl = document.getElementById('order-total');
    if (!box) return;
    var html = '', total = 0;
    Object.keys(qty).forEach(function (id) {
      var q = qty[id];
      if (!q || !catalog[id]) return;
      var line = catalog[id].price_cents * q;
      total += line;
      html += '<div class="st-order__line"><span>' + esc(catalog[id].name) + ' × ' + q +
              '</span><b>' + money(line) + '</b></div>';
    });
    box.innerHTML = html || '<div class="st-order__line"><span>—</span><b>$0.00</b></div>';
    totalEl.textContent = money(total);
    var hasCard = qty.business_card > 0;
    var customBox = document.getElementById('bc-custom');
    if (customBox) customBox.style.display = hasCard ? '' : 'none';
  }

  function readShip() {
    return {
      ship_name: document.getElementById('sh-name').value.trim(),
      ship_address1: document.getElementById('sh-a1').value.trim(),
      ship_address2: document.getElementById('sh-a2').value.trim(),
      ship_city: document.getElementById('sh-city').value.trim(),
      ship_state: document.getElementById('sh-state').value.trim(),
      ship_zip: document.getElementById('sh-zip').value.trim()
    };
  }

  function showMsg(kind, text) {
    var el = document.getElementById('store-msg');
    el.className = 'st-msg ' + kind;
    el.textContent = text;
  }

  /* ── checkout ── */
  var payBtn = document.getElementById('store-pay');
  if (payBtn) payBtn.addEventListener('click', function () {
    if (orderBusy) return;
    var items = [];
    Object.keys(qty).forEach(function (id) { if (qty[id] > 0) items.push({ product_id: id, qty: qty[id] }); });
    if (!items.length) return showMsg('err', T.errItems);
    var hasCard = items.some(function (i) { return i.product_id === 'business_card'; });
    var custom = { custom_name: null, custom_phone: null };
    if (hasCard) {
      var name = ((inName.value || '') + ' ' + (inLast.value || '')).trim();
      var phone = (inPhone.value || '').trim();
      if (!name || !phone) return showMsg('err', T.errCard);
      custom.custom_name = name;
      custom.custom_phone = phone;
    }
    var ship = readShip();
    if (!ship.ship_name || !ship.ship_address1 || !ship.ship_city || !ship.ship_state || !ship.ship_zip) {
      return showMsg('err', T.errShip);
    }

    orderBusy = true;
    payBtn.disabled = true;
    payBtn.textContent = T.paying;
    var base = location.origin + (EN ? '/en/store' : '/store');
    api('/store/checkout', {
      method: 'POST',
      body: Object.assign({
        items: items,
        success_url: base + '?paid=1',
        cancel_url: base + '?cancelled=1'
      }, custom, ship)
    }).then(function (d) {
      if (d.url) { location.href = d.url; return; }
      throw new Error('no url');
    }).catch(function (e) {
      orderBusy = false;
      payBtn.disabled = false;
      payBtn.textContent = T.pay;
      showMsg('err', e.status === 403 ? T.blockedMsg : (e.message || T.errNet));
    });
  });

  /* ── arranque ── */
  function boot() {
    // Vuelta de Stripe
    var q = new URLSearchParams(location.search);
    var sid = q.get('session_id');
    if (q.get('paid') === '1' && sid) {
      api('/store/confirm', { method: 'POST', body: { session_id: sid } })
        .then(function (d) { show(d.status === 'paid' ? 'success' : 'cancelled'); })
        .catch(function () { show('cancelled'); });
      return;
    }
    if (q.get('cancelled') === '1') { show('cancelled'); return; }

    if (!token()) { show('gate'); return; }

    api('/auth/web/me').then(function (u) {
      if ((u && u.role) !== 'driver') { show('blocked'); return; }
      return api('/store/products').then(function (d) {
        (d.products || []).forEach(function (p) {
          catalog[p.id] = { price_cents: p.price_cents, customizable: p.customizable,
                            name: EN ? p.name_en : p.name_es };
          var priceEl = document.querySelector('[data-price="' + p.id + '"]');
          if (priceEl) priceEl.textContent = money(p.price_cents);
          qty[p.id] = 0;
        });
        bindCatalog();
        renderSummary();
        renderPreview();
        show('shop');
      });
    }).catch(function (e) {
      if (e.status === 401) {
        location.replace((EN ? '../auth' : 'auth') + '?role=driver&return=' + (EN ? 'en/store' : 'store'));
        return;
      }
      show('gate');
    });
  }

  var switchBtn = document.getElementById('store-switch-btn');
  if (switchBtn) switchBtn.addEventListener('click', function () {
    try { localStorage.removeItem('vr_at'); localStorage.removeItem('vr_au'); } catch (_) {}
    location.href = (EN ? '../auth' : 'auth') + '?role=driver&return=' + (EN ? 'en/store' : 'store');
  });

  var gateBtn = document.getElementById('store-gate-btn');
  if (gateBtn) gateBtn.addEventListener('click', function () {
    location.href = (EN ? '../auth' : 'auth') + '?role=driver&return=' + (EN ? 'en/store' : 'store');
  });

  boot();
})();
