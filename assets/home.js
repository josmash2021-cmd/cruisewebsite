/* CruiseInRide — home nueva: reveal on scroll, copiar email, formulario a WhatsApp */
(function () {
  'use strict';

  /* barra promocional: cerrar y recordar durante la sesión */
  (function () {
    var bar = document.getElementById('promoBar');
    if (!bar) return;
    try { if (sessionStorage.getItem('cirPromoHide') === '1') { bar.classList.add('is-gone'); return; } } catch (e) {}
    var x = bar.querySelector('.promo-bar__close');
    if (x) x.addEventListener('click', function () {
      bar.classList.add('is-hiding');
      try { sessionStorage.setItem('cirPromoHide', '1'); } catch (e) {}
      setTimeout(function () { bar.classList.add('is-gone'); bar.classList.remove('is-hiding'); }, 380);
    });
  })();

  /* ---- reveal on scroll ---- */
  var els = document.querySelectorAll('.reveal');
  var statsAnimated = false;
  function runStatsCounters() {
    if (statsAnimated) return;
    statsAnimated = true;
    var statsSection = document.querySelector('.rv-stats');
    if (!statsSection) return;
    statsSection.querySelectorAll('.rs-item').forEach(function (item, idx) {
      var numEl = item.querySelector('.rs-num');
      var suffixEl = item.querySelector('.rs-suffix');
      var raw = numEl ? (numEl.getAttribute('data-target') || '') : '';
      var match = raw.match(/^(\d+\.?\d*)([a-z]*)$/i);
      if (!match) return;
      var targetNum = parseFloat(match[1]);
      var unit = match[2].toLowerCase();
      var originalSuffix = suffixEl ? suffixEl.textContent : '';
      var duration = 1600;
      var start = performance.now();
      var decimals = targetNum % 1 !== 0 ? 1 : 0;
      var step = function (now) {
        var p = Math.min((now - start) / duration, 1);
        var ease = 1 - Math.pow(1 - p, 4);
        var current = targetNum * ease;
        if (p >= 1) current = targetNum;
        var numText;
        if (decimals) {
          numText = current.toFixed(decimals);
        } else {
          numText = String(Math.floor(current));
        }
        if (numEl) numEl.textContent = numText + unit;
        if (suffixEl) suffixEl.textContent = originalSuffix;
        if (p < 1) requestAnimationFrame(step);
      };
      setTimeout(function () { requestAnimationFrame(step); }, idx * 120);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          if (e.target.classList.contains('rv-stats')) runStatsCounters();
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('visible'); });
    runStatsCounters();
  }

  /* ---- vídeo de servicio en bucle sin corte ----
         Dos capas iguales: cuando a la de delante le quedan FADE segundos,
         la de detrás arranca desde 0 y se cruza el fundido, de forma que el
         final del clip se enlaza con su propio comienzo. */
  document.querySelectorAll('.sv-loop').forEach(function (wrap) {
    var vids = wrap.querySelectorAll('.sv-video');
    if (vids.length < 2) return;
    var FADE = 1.1;                       /* igual que la transición del CSS */
    var front = 0;
    var raf = 0;
    var live = false;

    var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };

    var relay = function () {
      var a = vids[front];
      var b = vids[1 - front];
      if (a.duration && a.currentTime >= a.duration - FADE) {
        b.currentTime = 0;
        play(b);
        b.classList.add('is-front');
        a.classList.remove('is-front');
        front = 1 - front;
        /* la capa saliente se para cuando ya es invisible */
        setTimeout(function () { if (!a.classList.contains('is-front')) a.pause(); }, FADE * 1000);
      }
      if (live) raf = requestAnimationFrame(relay);
    };

    var start = function () {
      if (live) return;
      live = true;
      play(vids[front]);
      raf = requestAnimationFrame(relay);
    };
    var stop = function () {
      live = false;
      cancelAnimationFrame(raf);
      vids.forEach(function (v) { v.pause(); });
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0.2 }).observe(wrap);
    } else {
      start();
    }
  });

  /* ---- showreel: solo reproduce mientras está en pantalla ---- */
  var reel = document.querySelector('.showreel-video');
  if (reel) {
    var playReel = function () { var p = reel.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) playReel(); else reel.pause();
        });
      }, { threshold: 0.15 }).observe(reel);
    } else {
      playReel();
    }
  }

  /* ---- zigzag del footer: se dibuja una sola vez al entrar en pantalla ---- */
  var route = document.querySelector('.cf-route');
  if (route && 'IntersectionObserver' in window) {
    /* la clase --anim es la que oculta el trazo; sin JS la linea queda dibujada */
    route.classList.add('cf-route--anim');
    var routeIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-lit');
        routeIo.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    routeIo.observe(route);
  }

  /* ---- botón flotante de WhatsApp: mensaje ya escrito según el idioma.
         El href del HTML es neutro (solo el número) para que funcione igual
         en las páginas que no cargan este script. El botón va al final del
         body, después de este <script>, así que hay que esperar al DOM. ---- */
  var waInit = function () {
    var waFab = document.querySelector('.wa-fab');
    if (!waFab) return;
    var waEs = document.documentElement.lang !== 'en';
    waFab.href = 'https://wa.me/16593052974?text=' + encodeURIComponent(waEs
      ? 'Hola, quiero información sobre un traslado con CruiseInRide.'
      : 'Hi, I would like information about a ride with CruiseInRide.');
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waInit);
  } else {
    waInit();
  }

  /* ---- botón copiar email ---- */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      var label = btn.querySelector('span');
      var original = label ? label.textContent : '';
      var done = function () {
        if (!label) return;
        label.textContent = btn.getAttribute('data-copied') || '¡Copiado!';
        setTimeout(function () { label.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* noop */ }
        document.body.removeChild(ta);
        done();
      }
    });
  });

  /* ---- coreografía del hero: el contenido cambia en el 30s y el
         metraje se repite en bucle saltándose la pantalla negra final
         (el vídeo traía una tarjeta negra con íconos borrosos incrustados
         a partir del ~34.6s; nos la saltamos reiniciando el metraje) ---- */
  var hero = document.querySelector('.hero');
  var heroVideo = document.querySelector('.hero-video');
  if (hero && heroVideo) {
    var phase2Done = false;
    var goPhase2 = function () {
      if (phase2Done) return;
      phase2Done = true;
      hero.classList.add('hero--phase2');
      initRideMap();
    };
    var checkPhase = function () {
      if (!phase2Done && heroVideo.currentTime >= 6) goPhase2();
      if (heroVideo.currentTime >= 34.6) {
        heroVideo.currentTime = 0.1;   /* bucle: nunca mostramos la tarjeta negra */
      }
    };
    heroVideo.addEventListener('timeupdate', checkPhase);
    /* fallback: si el vídeo no llega a cargar/reproducir (ahorro de datos,
       autoplay bloqueado, red lenta), el panel aparece igualmente a los 7.5s */
    setTimeout(goPhase2, 7500);
  }

  /* ---- mapa del panel "Solicita tu viaje" (fase 2 del hero):
     misma experiencia del mapa de reservas: carreteras doradas,
     edificios 3D, pines dorados animados y ruta dibujándose ---- */
  var rideMapInit = false;
  var rideMap = null, ridePickupMarker = null, rideDropoffMarker = null, rideRouteCancelled = false;
  var rideDemoRoute = null, rideDemoReq = 0;
  var GOLD_PIN_ICONS = {
    person: '<circle cx="24" cy="14" r="2.8" fill="#fff"/><path d="M19.5 22.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill="#fff" stroke="#fff" stroke-width=".5" stroke-linecap="round"/>',
    flight: '<path d="M29.5 13.5l-2.5 1.5-4-2.5-1.5.8 3 3.5-3 1.5-1.8-.5-1.2.7 2 1.5 2.5 0 5-3 2.5-1.2c.7-.4.7-1.2 0-1.5l-1-.8z" fill="#fff"/>'
  };
  function goldenPinSvg(iconPath) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 46" fill="none" width="48" height="46">'
      + '<defs><linearGradient id="pg" x1="24" y1="2" x2="24" y2="44" gradientUnits="userSpaceOnUse">'
      + '<stop offset="0" stop-color="#F5DC7A"/><stop offset=".45" stop-color="#D4A800"/><stop offset="1" stop-color="#B08800"/>'
      + '</linearGradient><radialGradient id="ph" cx="24" cy="16.3" r="17" gradientUnits="userSpaceOnUse">'
      + '<stop offset="0" stop-color="#E8C547" stop-opacity=".22"/><stop offset=".5" stop-color="#E8C547" stop-opacity=".06"/><stop offset="1" stop-color="#E8C547" stop-opacity="0"/>'
      + '</radialGradient><radialGradient id="pw" cx="24" cy="16.3" r="11" gradientUnits="userSpaceOnUse">'
      + '<stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".3" stop-color="#fff" stop-opacity=".18"/><stop offset=".65" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>'
      + '</radialGradient><filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/></filter></defs>'
      + '<circle cx="24" cy="16.3" r="17" fill="url(#ph)"/>'
      + '<circle cx="24" cy="16.3" r="11" fill="url(#pw)"/>'
      + '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="#D4A800" opacity=".4" filter="url(#ps)"/>'
      + '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="url(#pg)"/>'
      + '<path d="M32.3 22.6 A10.4 10.4 0 0 1 15.7 22.6 Q24 26.2 32.3 22.6Z" fill="#0a1128"/>'
      + '<path d="M35.5 23.5 A13.8 13.8 0 0 0 30.5 13" stroke="#fff" stroke-opacity=".28" stroke-width=".8" fill="none" stroke-linecap="round"/>'
      + iconPath
      + '</svg>';
  }
  function makePinEl(icon, pulse, youText) {
    var el = document.createElement('div'); el.className = 'h-ride__pin' + (pulse ? ' h-ride__pin--pulse' : '');
    var inner = document.createElement('div'); inner.className = 'h-ride__pinInner';
    inner.innerHTML = goldenPinSvg(icon);
    el.appendChild(inner);
    if (youText) { var y = document.createElement('div'); y.className = 'h-ride__you'; y.textContent = youText; el.appendChild(y); }
    return el;
  }
  function initRideMap() {
    if (rideMapInit) return;
    var el = document.getElementById('hRideMap');
    if (!el || typeof mapboxgl === 'undefined') return;
    rideMapInit = true;
    mapboxgl.accessToken = 'pk.eyJ1Ijoicm95YWxwdXJwbGVjb3JwIiwiYSI6ImNtbHk4cmpsNjExamwzZm9sOGFobXZoZTMifQ.YNkz-m3W7noKKDKbwn9y3w';
    /* arranque dinámico: tu ubicación (si hay GPS) o la ciudad seleccionada,
       y como destino el aeropuerto de referencia de esa ciudad */
    var FALLBACK_CITY = { coords: [-86.8104, 33.5186], hub: [-86.7535, 33.5629], hubName: ['Aeropuerto Internacional de Birmingham-Shuttlesworth', 'Birmingham-Shuttlesworth International Airport'] };
    var demoCity = (typeof curCity !== 'undefined' && curCity && curCity.hub) ? curCity : FALLBACK_CITY;
    var hasUser = (typeof userPos !== 'undefined' && userPos);
    var START = hasUser ? [userPos.lng, userPos.lat] : demoCity.coords;
    var isEs = (document.documentElement.lang || 'es').indexOf('es') === 0;
    var map = new mapboxgl.Map({
      container: el,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: START,
      zoom: 10.6,
      pitch: 45,
      bearing: -10,
      maxPitch: 55,
      attributionControl: false,
      antialias: true,
      fadeDuration: 0,
      renderWorldCopies: false,
      /* solo se mira: sin arrastrar, zoom, rotar ni teclado; la camara se
         mueve desde el codigo (easeTo/fitBounds) */
      interactive: false
    });
    rideMap = map;
    /* el panel aparece con una transición; reajustamos el lienzo al mostrarse */
    setTimeout(function () { map.resize(); }, 1200);
    setTimeout(function () { map.resize(); }, 2500);
    map.on('load', function () {
      var logo = el.querySelector('.mapboxgl-ctrl-logo');
      if (logo) logo.style.display = 'none';
      map.resize();
      /* ocultamos el esqueleto dorado cuando el mapa ya está listo */
      var sk = el.querySelector('.h-ride__mapSk');
      if (sk) { sk.classList.add('is-hidden'); setTimeout(function () { if (sk.parentNode) sk.parentNode.removeChild(sk); }, 700); }
      /* entrada cinematográfica igual que en reservas */
      setTimeout(function () { map.easeTo({ pitch: 52, bearing: -12, duration: 1600, easing: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; } }); }, 400);
      /* paleta Cruise: noche azul profunda + carreteras doradas */
      function _sp(lid, prop, val) { try { map.setPaintProperty(lid, prop, val); } catch (e) {} }
      _sp('background', 'background-color', '#0A1128');
      _sp('land', 'background-color', '#0A1128');
      _sp('landcover', 'fill-color', '#0F1A36');
      _sp('landuse', 'fill-color', '#0F1A36');
      _sp('water', 'fill-color', '#070E22');
      _sp('water-shadow', 'fill-color', '#070E22');
      _sp('building', 'fill-color', '#111D3A');
      _sp('building-outline', 'fill-color', '#111D3A');
      /* edificios 3D con tinte dorado */
      try {
        var _lbl = null, _lys = map.getStyle().layers;
        for (var i = 0; i < _lys.length; i++) if (_lys[i].type === 'symbol' && _lys[i].layout && _lys[i].layout['text-field']) { _lbl = _lys[i].id; break; }
        map.addLayer({ id: 'vr3dB', source: 'composite', 'source-layer': 'building', filter: ['all', ['==', 'extrude', 'true'], ['has', 'height']], type: 'fill-extrusion', minzoom: 15, paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#1a2548', 40, '#3d4f8c', 150, '#8a6e1c'], 'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.8, ['get', 'height']], 'fill-extrusion-base': ['get', 'min_height'], 'fill-extrusion-opacity': .6, 'fill-extrusion-vertical-gradient': true } }, _lbl);
      } catch (e) {}
      var GOLD = '#D4AF37', GOLD_CASE = '#B8960C', GREY_ROAD = '#2A2E3A', GREY_MINOR = '#1E2128', GREY_CASE = '#161820';
      ['road-motorway-trunk', 'road-motorway', 'road-trunk', 'road-motorway-trunk-link', 'road-motorway-navigation', 'road-trunk-navigation', 'bridge-motorway-trunk', 'bridge-motorway', 'bridge-trunk', 'bridge-motorway-trunk-link', 'tunnel-motorway-trunk', 'tunnel-motorway', 'tunnel-trunk', 'tunnel-motorway-trunk-link', 'road-major', 'road-highway', 'motorway', 'trunk', 'highway', 'road-highway-motorway', 'road-highway-trunk'].forEach(function (lid) { _sp(lid, 'line-color', GOLD); });
      ['road-motorway-trunk-case', 'road-motorway-case', 'road-trunk-case', 'bridge-motorway-trunk-case', 'bridge-motorway-case', 'bridge-trunk-case', 'tunnel-motorway-trunk-case', 'tunnel-motorway-case', 'tunnel-trunk-case', 'road-highway-case', 'road-major-case', 'motorway-case', 'trunk-case', 'highway-case'].forEach(function (lid) { _sp(lid, 'line-color', GOLD_CASE); });
      ['road-primary', 'road-secondary-tertiary', 'road-primary-link', 'road-secondary-tertiary-link', 'bridge-primary', 'bridge-secondary-tertiary', 'bridge-primary-link', 'tunnel-primary', 'tunnel-secondary-tertiary', 'tunnel-primary-link'].forEach(function (lid) { _sp(lid, 'line-color', GREY_ROAD); });
      ['road-primary-case', 'road-secondary-tertiary-case', 'bridge-primary-case', 'bridge-secondary-tertiary-case', 'tunnel-primary-case', 'tunnel-secondary-tertiary-case'].forEach(function (lid) { _sp(lid, 'line-color', GREY_CASE); });
      ['road-street', 'road-minor', 'road-minor-low', 'road-street-low', 'road-service-link', 'road-path', 'road-pedestrian', 'bridge-street', 'bridge-minor', 'tunnel-street', 'tunnel-minor'].forEach(function (lid) { _sp(lid, 'line-color', GREY_MINOR); });
      /* pines dorados animados y ruta dibujándose: recogida → aeropuerto.
         Reutilizable: arranque (ciudad default), GPS en vivo y "Cambiar ciudad". */
      function removeDemoLayers() {
        ['route-glow', 'route-casing', 'route-line'].forEach(function (lid) { try { if (map.getLayer(lid)) map.removeLayer(lid); } catch (e) {} });
        try { if (map.getSource('route')) map.removeSource('route'); } catch (e) {}
      }
      ['country-label', 'state-label', 'settlement-label', 'settlement-minor-label', 'settlement-subdivision-label', 'road-label', 'transit-label', 'natural-point-label', 'water-point-label', 'water-line-label', 'natural-line-label', 'poi-label'].forEach(function (id) { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) {} });
      rideDemoRoute = function (fromCoords, city, pickupIsUser) {
        var req = ++rideDemoReq;
        rideRouteCancelled = true;
        if (ridePickupMarker) { ridePickupMarker.remove(); ridePickupMarker = null; }
        if (rideDropoffMarker) { rideDropoffMarker.remove(); rideDropoffMarker = null; }
        removeDemoLayers();
        ridePickupMarker = new mapboxgl.Marker({ element: makePinEl(GOLD_PIN_ICONS.person, false, pickupIsUser ? (isEs ? 'TÚ' : 'YOU') : null) }).setLngLat(fromCoords).addTo(map);
        setTimeout(function () {
          if (req !== rideDemoReq) return;
          rideDropoffMarker = new mapboxgl.Marker({ element: makePinEl(GOLD_PIN_ICONS.flight, true) }).setLngLat(city.hub).addTo(map);
        }, 700);
        /* ruta dorada dibujándose: recogida → aeropuerto */
        fetch('https://api.mapbox.com/directions/v5/mapbox/driving/' + fromCoords[0] + ',' + fromCoords[1] + ';' + city.hub[0] + ',' + city.hub[1] + '?geometries=geojson&overview=full&access_token=' + encodeURIComponent(mapboxgl.accessToken))
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (req !== rideDemoReq) return;
            var geom = d && d.routes && d.routes[0] && d.routes[0].geometry;
            if (!geom || !geom.coordinates || geom.coordinates.length < 2) return;
            var coords = [fromCoords].concat(geom.coordinates).concat([city.hub]);
            removeDemoLayers();
            map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }, lineMetrics: true });
            var _L = { 'line-cap': 'round', 'line-join': 'round' }, LAYERS = ['route-glow', 'route-casing', 'route-line'];
            map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: _L, paint: { 'line-color': '#D4AF37', 'line-width': 14, 'line-opacity': .18, 'line-blur': 10, 'line-trim-offset': [0, 0] } });
            map.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: _L, paint: { 'line-color': '#1a0f00', 'line-width': 6, 'line-opacity': .82, 'line-trim-offset': [0, 0] } });
            map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: _L, paint: { 'line-width': 3.5, 'line-opacity': .98, 'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#D4AF37', .5, '#FFD700', 1, '#E8C547'], 'line-trim-offset': [0, 0] } });
            /* la ruta se dibuja de recogida a destino */
            var st = performance.now(), dur = 1800;
            map.repaint = true;
            (function tick(now) {
              if (req !== rideDemoReq) { map.repaint = false; return; }
              var t = Math.min(1, (now - st) / dur), p = 1 - Math.pow(1 - t, 4), tr = [0, p];
              LAYERS.forEach(function (id) { if (map.getLayer(id)) map.setPaintProperty(id, 'line-trim-offset', tr, { validate: false }); });
              if (t < 1) requestAnimationFrame(tick); else map.repaint = false;
            })(st);
            /* encuadre final de la ruta completa */
            var b = new mapboxgl.LngLatBounds(); coords.forEach(function (c) { b.extend(c); });
            setTimeout(function () { if (req !== rideDemoReq) return; map.fitBounds(b, { padding: { top: 70, bottom: 70, left: 70, right: 70 }, pitch: 45, bearing: -10, duration: 1400 }); }, 2100);
          }).catch(function () {});
      };
      /* demo de arranque: tu ubicación (o ciudad seleccionada) → su aeropuerto */
      rideDemoRoute(START, demoCity, !!hasUser);
    });
  }

  /* ---- modal "Cambiar ciudad": nuestra operación es Alabama y el sur de Florida ---- */
  var RIDE_CITY_ICONS = {
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
    anchor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>'
  };
  var RIDE_CITIES = [
    /* ---- Alabama ---- */
    { id: 'auburn', es: 'Auburn', en: 'Auburn', st: 'AL', coords: [-85.4808, 32.6099], pop: 0,
      hub: [-86.3940, 32.3006], hubName: ['Aeropuerto Regional de Montgomery', 'Montgomery Regional Airport'],
      sugs: [
        { ic: 'pin', es: ['Universidad de Auburn', '107 Samford Hall, Auburn, AL'], en: ['Auburn University', '107 Samford Hall, Auburn, AL'] },
        { ic: 'pin', es: ['Estadio Jordan-Hare', '251 S Donahue Dr, Auburn, AL'], en: ['Jordan-Hare Stadium', '251 S Donahue Dr, Auburn, AL'] } ] },
    { id: 'birmingham', es: 'Birmingham', en: 'Birmingham', st: 'AL', coords: [-86.8104, 33.5186], pop: 1,
      hub: [-86.7535, 33.5629], hubName: ['Aeropuerto Internacional de Birmingham-Shuttlesworth', 'Birmingham-Shuttlesworth International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Birmingham-Shuttlesworth (BHM)', '5900 Messer Airport Hwy, Birmingham, AL'], en: ['Birmingham-Shuttlesworth International Airport (BHM)', '5900 Messer Airport Hwy, Birmingham, AL'] },
        { ic: 'pin', es: ['Downtown Birmingham', '20th St N, Birmingham, AL'], en: ['Downtown Birmingham', '20th St N, Birmingham, AL'] } ] },
    { id: 'decatur', es: 'Decatur', en: 'Decatur', st: 'AL', coords: [-86.9833, 34.6059], pop: 0,
      hub: [-86.7751, 34.6372], hubName: ['Aeropuerto Internacional de Huntsville', 'Huntsville International Airport'],
      sugs: [
        { ic: 'pin', es: ['Point Mallard Park', '2901 Point Mallard Dr SE, Decatur, AL'], en: ['Point Mallard Park', '2901 Point Mallard Dr SE, Decatur, AL'] },
        { ic: 'pin', es: ['Downtown Decatur', '2nd Ave SE, Decatur, AL'], en: ['Downtown Decatur', '2nd Ave SE, Decatur, AL'] } ] },
    { id: 'dothan', es: 'Dothan', en: 'Dothan', st: 'AL', coords: [-85.3905, 31.2232], pop: 0,
      hub: [-85.4496, 31.3213], hubName: ['Aeropuerto Regional de Dothan', 'Dothan Regional Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Regional de Dothan (DHN)', '800 Airport Dr, Dothan, AL'], en: ['Dothan Regional Airport (DHN)', '800 Airport Dr, Dothan, AL'] },
        { ic: 'pin', es: ['Downtown Dothan', 'N Foster St, Dothan, AL'], en: ['Downtown Dothan', 'N Foster St, Dothan, AL'] } ] },
    { id: 'florence', es: 'Florence', en: 'Florence', st: 'AL', coords: [-87.6772, 34.7998], pop: 0,
      hub: [-87.6102, 34.7453], hubName: ['Aeropuerto Regional del Noroeste de Alabama', 'Northwest Alabama Regional Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Regional del Noroeste de Alabama (MSL)', '1729 T Ed Campbell Dr, Muscle Shoals, AL'], en: ['Northwest Alabama Regional Airport (MSL)', '1729 T Ed Campbell Dr, Muscle Shoals, AL'] },
        { ic: 'pin', es: ['Downtown Florence', 'N Court St, Florence, AL'], en: ['Downtown Florence', 'N Court St, Florence, AL'] } ] },
    { id: 'gulf-shores', es: 'Gulf Shores', en: 'Gulf Shores', st: 'AL', coords: [-87.7008, 30.2460], pop: 0,
      hub: [-88.2428, 30.6912], hubName: ['Aeropuerto Regional de Mobile', 'Mobile Regional Airport'],
      sugs: [
        { ic: 'anchor', es: ['Playa de Gulf Shores', '101 Gulf Shores Pkwy, Gulf Shores, AL'], en: ['Gulf Shores Beach', '101 Gulf Shores Pkwy, Gulf Shores, AL'] },
        { ic: 'pin', es: ['The Wharf', '23101 Canal Rd, Orange Beach, AL'], en: ['The Wharf', '23101 Canal Rd, Orange Beach, AL'] } ] },
    { id: 'hoover', es: 'Hoover', en: 'Hoover', st: 'AL', coords: [-86.8114, 33.4054], pop: 0,
      hub: [-86.7535, 33.5629], hubName: ['Aeropuerto Internacional de Birmingham-Shuttlesworth', 'Birmingham-Shuttlesworth International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Birmingham-Shuttlesworth (BHM)', '5900 Messer Airport Hwy, Birmingham, AL'], en: ['Birmingham-Shuttlesworth International Airport (BHM)', '5900 Messer Airport Hwy, Birmingham, AL'] },
        { ic: 'pin', es: ['The Summit', '214 Summit Blvd, Birmingham, AL'], en: ['The Summit', '214 Summit Blvd, Birmingham, AL'] } ] },
    { id: 'huntsville', es: 'Huntsville', en: 'Huntsville', st: 'AL', coords: [-86.5861, 34.7304], pop: 0,
      hub: [-86.7751, 34.6372], hubName: ['Aeropuerto Internacional de Huntsville', 'Huntsville International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Huntsville (HSV)', '1000 Glenn Hearn Blvd SW, Huntsville, AL'], en: ['Huntsville International Airport (HSV)', '1000 Glenn Hearn Blvd SW, Huntsville, AL'] },
        { ic: 'pin', es: ['U.S. Space & Rocket Center', '1 Tranquility Base, Huntsville, AL'], en: ['U.S. Space & Rocket Center', '1 Tranquility Base, Huntsville, AL'] } ] },
    { id: 'mobile', es: 'Mobile', en: 'Mobile', st: 'AL', coords: [-88.0399, 30.6954], pop: 0,
      hub: [-88.2428, 30.6912], hubName: ['Aeropuerto Regional de Mobile', 'Mobile Regional Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Regional de Mobile (MOB)', '8400 Airport Blvd, Mobile, AL'], en: ['Mobile Regional Airport (MOB)', '8400 Airport Blvd, Mobile, AL'] },
        { ic: 'anchor', es: ['USS Alabama Battleship', '2703 Battleship Pkwy, Mobile, AL'], en: ['USS Alabama Battleship', '2703 Battleship Pkwy, Mobile, AL'] } ] },
    { id: 'montgomery', es: 'Montgomery', en: 'Montgomery', st: 'AL', coords: [-86.2999, 32.3792], pop: 0,
      hub: [-86.3940, 32.3006], hubName: ['Aeropuerto Regional de Montgomery', 'Montgomery Regional Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Regional de Montgomery (MGM)', '4445 Selma Hwy, Montgomery, AL'], en: ['Montgomery Regional Airport (MGM)', '4445 Selma Hwy, Montgomery, AL'] },
        { ic: 'pin', es: ['Downtown Montgomery', 'Dexter Ave, Montgomery, AL'], en: ['Downtown Montgomery', 'Dexter Ave, Montgomery, AL'] } ] },
    { id: 'orange-beach', es: 'Orange Beach', en: 'Orange Beach', st: 'AL', coords: [-87.5730, 30.2697], pop: 0,
      hub: [-88.2428, 30.6912], hubName: ['Aeropuerto Regional de Mobile', 'Mobile Regional Airport'],
      sugs: [
        { ic: 'pin', es: ['The Wharf', '23101 Canal Rd, Orange Beach, AL'], en: ['The Wharf', '23101 Canal Rd, Orange Beach, AL'] },
        { ic: 'anchor', es: ['Orange Beach Waterfront Park', '26425 Canal Rd, Orange Beach, AL'], en: ['Orange Beach Waterfront Park', '26425 Canal Rd, Orange Beach, AL'] } ] },
    { id: 'tuscaloosa', es: 'Tuscaloosa', en: 'Tuscaloosa', st: 'AL', coords: [-87.5692, 33.2098], pop: 0,
      hub: [-86.7535, 33.5629], hubName: ['Aeropuerto Internacional de Birmingham-Shuttlesworth', 'Birmingham-Shuttlesworth International Airport'],
      sugs: [
        { ic: 'pin', es: ['Universidad de Alabama', '751 Campus Dr, Tuscaloosa, AL'], en: ['University of Alabama', '751 Campus Dr, Tuscaloosa, AL'] },
        { ic: 'pin', es: ['Estadio Bryant-Denny', '920 Paul W Bryant Dr, Tuscaloosa, AL'], en: ['Bryant-Denny Stadium', '920 Paul W Bryant Dr, Tuscaloosa, AL'] } ] },
    /* ---- Sur de Florida ---- */
    { id: 'aventura', es: 'Aventura', en: 'Aventura', st: 'FL', coords: [-80.1392, 25.9565], pop: 0,
      hub: [-80.1527, 26.0726], hubName: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood', 'Fort Lauderdale-Hollywood International Airport'],
      sugs: [
        { ic: 'pin', es: ['Aventura Mall', '19501 Biscayne Blvd, Aventura, FL'], en: ['Aventura Mall', '19501 Biscayne Blvd, Aventura, FL'] },
        { ic: 'pin', es: ['Gulfstream Park', '901 S Federal Hwy, Hallandale Beach, FL'], en: ['Gulfstream Park', '901 S Federal Hwy, Hallandale Beach, FL'] } ] },
    { id: 'boca-raton', es: 'Boca Raton', en: 'Boca Raton', st: 'FL', coords: [-80.1289, 26.3683], pop: 0,
      hub: [-80.1527, 26.0726], hubName: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood', 'Fort Lauderdale-Hollywood International Airport'],
      sugs: [
        { ic: 'pin', es: ['Mizner Park', '327 Plaza Real, Boca Raton, FL'], en: ['Mizner Park', '327 Plaza Real, Boca Raton, FL'] },
        { ic: 'pin', es: ['Boca Raton Resort & Club', '501 E Camino Real, Boca Raton, FL'], en: ['Boca Raton Resort & Club', '501 E Camino Real, Boca Raton, FL'] } ] },
    { id: 'coral-gables', es: 'Coral Gables', en: 'Coral Gables', st: 'FL', coords: [-80.2684, 25.7215], pop: 0,
      hub: [-80.2870, 25.7959], hubName: ['Aeropuerto Internacional de Miami', 'Miami International Airport'],
      sugs: [
        { ic: 'pin', es: ['Miracle Mile', 'Miracle Mile, Coral Gables, FL'], en: ['Miracle Mile', 'Miracle Mile, Coral Gables, FL'] },
        { ic: 'pin', es: ['Venetian Pool', '2701 De Soto Blvd, Coral Gables, FL'], en: ['Venetian Pool', '2701 De Soto Blvd, Coral Gables, FL'] } ] },
    { id: 'delray-beach', es: 'Delray Beach', en: 'Delray Beach', st: 'FL', coords: [-80.0728, 26.4615], pop: 0,
      hub: [-80.0956, 26.6832], hubName: ['Aeropuerto Internacional de Palm Beach', 'Palm Beach International Airport'],
      sugs: [
        { ic: 'pin', es: ['Atlantic Avenue', 'Atlantic Ave, Delray Beach, FL'], en: ['Atlantic Avenue', 'Atlantic Ave, Delray Beach, FL'] },
        { ic: 'anchor', es: ['Playa Municipal de Delray', 'S Ocean Blvd, Delray Beach, FL'], en: ['Delray Municipal Beach', 'S Ocean Blvd, Delray Beach, FL'] } ] },
    { id: 'fort-lauderdale', es: 'Fort Lauderdale', en: 'Fort Lauderdale', st: 'FL', coords: [-80.1373, 26.1224], pop: 3,
      hub: [-80.1527, 26.0726], hubName: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood', 'Fort Lauderdale-Hollywood International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood (FLL)', '100 Terminal Dr, Fort Lauderdale, FL'], en: ['Fort Lauderdale-Hollywood International Airport (FLL)', '100 Terminal Dr, Fort Lauderdale, FL'] },
        { ic: 'anchor', es: ['Port Everglades', '1850 Eller Dr, Fort Lauderdale, FL'], en: ['Port Everglades', '1850 Eller Dr, Fort Lauderdale, FL'] } ] },
    { id: 'fort-myers', es: 'Fort Myers', en: 'Fort Myers', st: 'FL', coords: [-81.8723, 26.6406], pop: 0,
      hub: [-81.7552, 26.5366], hubName: ['Aeropuerto Internacional de Southwest Florida', 'Southwest Florida International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Southwest Florida (RSW)', '11000 Terminal Access Rd, Fort Myers, FL'], en: ['Southwest Florida International Airport (RSW)', '11000 Terminal Access Rd, Fort Myers, FL'] },
        { ic: 'anchor', es: ['Isla Sanibel', 'Sanibel, FL'], en: ['Sanibel Island', 'Sanibel, FL'] } ] },
    { id: 'hollywood', es: 'Hollywood', en: 'Hollywood', st: 'FL', coords: [-80.1495, 26.0112], pop: 0,
      hub: [-80.1527, 26.0726], hubName: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood', 'Fort Lauderdale-Hollywood International Airport'],
      sugs: [
        { ic: 'anchor', es: ['Hollywood Beach Broadwalk', 'N Broadwalk, Hollywood, FL'], en: ['Hollywood Beach Broadwalk', 'N Broadwalk, Hollywood, FL'] },
        { ic: 'pin', es: ['Seminole Hard Rock Hotel', '1 Seminole Way, Hollywood, FL'], en: ['Seminole Hard Rock Hotel', '1 Seminole Way, Hollywood, FL'] } ] },
    { id: 'key-west', es: 'Cayo Hueso', en: 'Key West', st: 'FL', coords: [-81.7800, 24.5551], pop: 0,
      hub: [-81.7596, 24.5561], hubName: ['Aeropuerto Internacional de Cayo Hueso', 'Key West International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Cayo Hueso (EYW)', '3491 S Roosevelt Blvd, Key West, FL'], en: ['Key West International Airport (EYW)', '3491 S Roosevelt Blvd, Key West, FL'] },
        { ic: 'anchor', es: ['Mallory Square', '400 Wall St, Key West, FL'], en: ['Mallory Square', '400 Wall St, Key West, FL'] } ] },
    { id: 'miami', es: 'Miami', en: 'Miami', st: 'FL', coords: [-80.1918, 25.7617], pop: 2,
      hub: [-80.2870, 25.7959], hubName: ['Aeropuerto Internacional de Miami', 'Miami International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Miami (MIA)', '2100 NW 42nd Ave, Miami, FL'], en: ['Miami International Airport (MIA)', '2100 NW 42nd Ave, Miami, FL'] },
        { ic: 'anchor', es: ['PortMiami', '1015 N America Way, Miami, FL'], en: ['PortMiami', '1015 N America Way, Miami, FL'] } ] },
    { id: 'miami-beach', es: 'Miami Beach', en: 'Miami Beach', st: 'FL', coords: [-80.1300, 25.7907], pop: 0,
      hub: [-80.2870, 25.7959], hubName: ['Aeropuerto Internacional de Miami', 'Miami International Airport'],
      sugs: [
        { ic: 'anchor', es: ['South Beach', 'Ocean Dr, Miami Beach, FL'], en: ['South Beach', 'Ocean Dr, Miami Beach, FL'] },
        { ic: 'pin', es: ['Fontainebleau Miami Beach', '4441 Collins Ave, Miami Beach, FL'], en: ['Fontainebleau Miami Beach', '4441 Collins Ave, Miami Beach, FL'] } ] },
    { id: 'naples', es: 'Naples', en: 'Naples', st: 'FL', coords: [-81.7948, 26.1420], pop: 0,
      hub: [-81.7552, 26.5366], hubName: ['Aeropuerto Internacional de Southwest Florida', 'Southwest Florida International Airport'],
      sugs: [
        { ic: 'pin', es: ['Fifth Avenue South', '5th Ave S, Naples, FL'], en: ['Fifth Avenue South', '5th Ave S, Naples, FL'] },
        { ic: 'anchor', es: ['Muelle de Naples', '25 12th Ave S, Naples, FL'], en: ['Naples Pier', '25 12th Ave S, Naples, FL'] } ] },
    { id: 'palm-beach', es: 'Palm Beach', en: 'Palm Beach', st: 'FL', coords: [-80.0364, 26.7056], pop: 0,
      hub: [-80.0956, 26.6832], hubName: ['Aeropuerto Internacional de Palm Beach', 'Palm Beach International Airport'],
      sugs: [
        { ic: 'pin', es: ['Worth Avenue', 'Worth Ave, Palm Beach, FL'], en: ['Worth Avenue', 'Worth Ave, Palm Beach, FL'] },
        { ic: 'pin', es: ['The Breakers', '1 S County Rd, Palm Beach, FL'], en: ['The Breakers', '1 S County Rd, Palm Beach, FL'] } ] },
    { id: 'pompano-beach', es: 'Pompano Beach', en: 'Pompano Beach', st: 'FL', coords: [-80.1248, 26.2379], pop: 0,
      hub: [-80.1527, 26.0726], hubName: ['Aeropuerto Internacional de Fort Lauderdale-Hollywood', 'Fort Lauderdale-Hollywood International Airport'],
      sugs: [
        { ic: 'anchor', es: ['Muelle de Pompano Beach', '222 N Pompano Beach Blvd, Pompano Beach, FL'], en: ['Pompano Beach Pier', '222 N Pompano Beach Blvd, Pompano Beach, FL'] },
        { ic: 'pin', es: ['Isle Casino Racing', '777 Isle of Capri Cir, Pompano Beach, FL'], en: ['Isle Casino Racing', '777 Isle of Capri Cir, Pompano Beach, FL'] } ] },
    { id: 'west-palm-beach', es: 'West Palm Beach', en: 'West Palm Beach', st: 'FL', coords: [-80.0534, 26.7153], pop: 4,
      hub: [-80.0956, 26.6832], hubName: ['Aeropuerto Internacional de Palm Beach', 'Palm Beach International Airport'],
      sugs: [
        { ic: 'plane', es: ['Aeropuerto Internacional de Palm Beach (PBI)', '1000 Turnage Blvd, West Palm Beach, FL'], en: ['Palm Beach International Airport (PBI)', '1000 Turnage Blvd, West Palm Beach, FL'] },
        { ic: 'anchor', es: ['Puerto de Palm Beach', '1 E 11th St, Riviera Beach, FL'], en: ['Port of Palm Beach', '1 E 11th St, Riviera Beach, FL'] } ] }
  ];

  var cityModal = document.getElementById('hCityModal');
  var cityLink = document.querySelector('.h-ride__cityLink');
  if (cityModal && cityLink) {
    var isEsCity = (document.documentElement.lang || 'es').indexOf('es') === 0;
    var bookHref = cityLink.getAttribute('href') || 'book.html';
    var citySearch = document.getElementById('hCitySearch');
    var cityList = document.getElementById('hCityList');
    var cityCurrentEl = cityModal.querySelector('.h-city__current');
    var cityNameEl = document.querySelector('.h-ride__cityName');
    var cityExplore = document.getElementById('hCityExplore');
    var curCity = RIDE_CITIES.filter(function (c) { return c.id === 'birmingham'; })[0] || RIDE_CITIES[0];
    function cityName(c) { return isEsCity ? c.es : c.en; }

    /* al cambiar de ciudad, las sugerencias del panel pasan a ser las de esa ciudad */
    function renderSugs(city) {
      var box = document.querySelector('.h-ride__sugs');
      if (!box) return;
      box.innerHTML = city.sugs.map(function (s) {
        var t = isEsCity ? s.es : s.en;
        return '<a class="h-ride__sug" href="' + bookHref + '"><span class="h-ride__sug-ic">'
          + RIDE_CITY_ICONS[s.ic]
          + '</span><span class="h-ride__sug-tx"><b>' + t[0] + '</b><small>' + t[1] + '</small></span></a>';
      }).join('');
    }

    function cityItemHtml(c) {
      return '<button type="button" class="h-city__item" data-city="' + c.id + '"><span class="h-city__ic">'
        + RIDE_CITY_ICONS.pin
        + '</span><span class="h-city__tx"><b>' + cityName(c) + '</b><small>' + (c.st === 'AL' ? 'Alabama' : 'Florida') + ', US</small></span></button>';
    }

    function renderCityList(q) {
      q = (q || '').trim().toLowerCase();
      var items = RIDE_CITIES.filter(function (c) { return !q || cityName(c).toLowerCase().indexOf(q) !== -1; });
      if (!items.length) {
        cityList.innerHTML = '<p class="h-city__empty">' + (isEsCity ? 'Pronto estaremos en tu ciudad' : 'We will be in your city soon') + '</p>';
        return;
      }
      var html = '';
      if (!q) {
        var pops = items.filter(function (c) { return c.pop; }).sort(function (a, b) { return a.pop - b.pop; });
        var alab = items.filter(function (c) { return c.st === 'AL' && !c.pop; });
        var sofl = items.filter(function (c) { return c.st === 'FL' && !c.pop; });
        html += '<p class="h-city__sec">' + (isEsCity ? 'Populares' : 'Popular') + '</p>' + pops.map(cityItemHtml).join('');
        html += '<p class="h-city__sec">Alabama</p>' + alab.map(cityItemHtml).join('');
        html += '<p class="h-city__sec">' + (isEsCity ? 'Sur de Florida' : 'South Florida') + '</p>' + sofl.map(cityItemHtml).join('');
      } else {
        html += items.map(cityItemHtml).join('');
      }
      cityList.innerHTML = html;
    }

    function openCityModal() {
      renderCityList('');
      if (citySearch) citySearch.value = '';
      cityModal.classList.add('is-open');
      cityModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('h-city-lock');
      setTimeout(function () { if (citySearch) citySearch.focus(); }, 300);
    }
    function closeCityModal() {
      cityModal.classList.remove('is-open');
      cityModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('h-city-lock');
    }

    function selectCity(id) {
      var city = null;
      RIDE_CITIES.forEach(function (c) { if (c.id === id) city = c; });
      if (!city) return;
      curCity = city;
      rideRouteCancelled = true;   /* anula ruta y pin de destino del arranque inicial */
      var n = cityName(city);
      if (cityNameEl) cityNameEl.textContent = n + ', ' + city.st + ', US';
      if (cityCurrentEl) cityCurrentEl.textContent = n + ', ' + city.st;
      renderSugs(city);
      closeCityModal();
      manualCity = true;
      if (geoWatchId !== null && navigator.geolocation) { navigator.geolocation.clearWatch(geoWatchId); geoWatchId = null; }
      if (typeof rideDemoRoute === 'function') {
        rideDemoRoute(city.coords, city, false);
      } else if (rideMap) {
        rideMap.flyTo({ center: city.coords, zoom: 10.6, pitch: 52, bearing: -12, duration: 2400 });
      }
    }

    cityLink.addEventListener('click', function (ev) { ev.preventDefault(); openCityModal(); });
    cityModal.querySelectorAll('[data-city-close]').forEach(function (el) { el.addEventListener('click', closeCityModal); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && cityModal.classList.contains('is-open')) closeCityModal(); });
    if (citySearch) citySearch.addEventListener('input', function () { renderCityList(citySearch.value); });
    cityList.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.h-city__item') : null;
      if (btn) selectCity(btn.getAttribute('data-city'));
    });
    /* "Explorar ciudad": vuelo cinematográfico sobre la ciudad actual */
    if (cityExplore) cityExplore.addEventListener('click', function () {
      closeCityModal();
      if (rideMap && curCity) rideMap.flyTo({ center: curCity.coords, zoom: 12.2, pitch: 55, bearing: 18, duration: 2600 });
    });

    /* ---- autocompletado pickup/dropoff: al completar ambos, ir a reservar ---- */
    var rideFields = document.querySelectorAll('.h-ride__field');
    var rideSel = { pickup: null, dropoff: null };
    var userPos = null;          /* {lat, lng} del GPS del visitante */
    var manualCity = false;      /* true si elige ciudad a mano en el modal */
    var geoWatchId = null;

    function escHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    /* ---- pines idénticos a los del mapa de reservar (book.html) ---- */
    function rideGoldenPin(iconPath) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 46" fill="none" width="48" height="46">'
        + '<defs><linearGradient id="pg" x1="24" y1="2" x2="24" y2="44" gradientUnits="userSpaceOnUse">'
        + '<stop offset="0" stop-color="#F5DC7A"/><stop offset=".45" stop-color="#D4A800"/><stop offset="1" stop-color="#B08800"/>'
        + '</linearGradient><radialGradient id="ph" cx="24" cy="16.3" r="17" gradientUnits="userSpaceOnUse">'
        + '<stop offset="0" stop-color="#E8C547" stop-opacity=".22"/><stop offset=".5" stop-color="#E8C547" stop-opacity=".06"/><stop offset="1" stop-color="#E8C547" stop-opacity="0"/>'
        + '</radialGradient><radialGradient id="pw" cx="24" cy="16.3" r="11" gradientUnits="userSpaceOnUse">'
        + '<stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".3" stop-color="#fff" stop-opacity=".18"/><stop offset=".65" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>'
        + '</radialGradient><filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/></filter></defs>'
        + '<circle cx="24" cy="16.3" r="17" fill="url(#ph)"/>'
        + '<circle cx="24" cy="16.3" r="11" fill="url(#pw)"/>'
        + '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="#D4A800" opacity=".4" filter="url(#ps)"/>'
        + '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="url(#pg)"/>'
        + '<path d="M32.3 22.6 A10.4 10.4 0 0 1 15.7 22.6 Q24 26.2 32.3 22.6Z" fill="#0a1128"/>'
        + '<path d="M35.5 23.5 A13.8 13.8 0 0 0 30.5 13" stroke="#fff" stroke-opacity=".28" stroke-width=".8" fill="none" stroke-linecap="round"/>'
        + iconPath
        + '</svg>';
    }
    var RIDE_PIN_ICONS = {
      person: '<circle cx="24" cy="14" r="2.8" fill="#fff"/><path d="M19.5 22.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill="#fff" stroke="#fff" stroke-width=".5" stroke-linecap="round"/>',
      home: '<path d="M24 11.5l-6 5h2v5h8v-5h2l-6-5z" fill="#fff"/><rect x="22" y="17.5" width="4" height="4" rx=".5" fill="#0a1128"/>',
      store: '<rect x="18" y="14" width="12" height="2.5" rx="1" fill="#fff"/><path d="M19 16.5v6h10v-6" fill="#fff"/><rect x="22" y="18" width="4" height="4.5" rx=".5" fill="#0a1128"/>',
      flight: '<path d="M29.5 13.5l-2.5 1.5-4-2.5-1.5.8 3 3.5-3 1.5-1.8-.5-1.2.7 2 1.5 2.5 0 5-3 2.5-1.2c.7-.4.7-1.2 0-1.5l-1-.8z" fill="#fff"/>',
      building: '<rect x="19" y="12" width="10" height="11" rx="1" fill="#fff"/><rect x="21" y="14" width="2" height="2" rx=".3" fill="#0a1128"/><rect x="25" y="14" width="2" height="2" rx=".3" fill="#0a1128"/><rect x="21" y="18" width="2" height="2" rx=".3" fill="#0a1128"/><rect x="25" y="18" width="2" height="2" rx=".3" fill="#0a1128"/>',
      location: '<path d="M24 12c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5z" fill="#fff"/><circle cx="24" cy="17.5" r="2" fill="#0a1128"/>'
    };
    function rideDetectDropoffIcon(name) {
      if (!name) return RIDE_PIN_ICONS.location;
      var n = name.toLowerCase();
      if (n.match(/airport|aeropuerto|terminal|intl|international|airline/)) return RIDE_PIN_ICONS.flight;
      if (n.match(/mall|plaza|hotel|inn|store|market|walmart|target|costco|office|center|clinic|hospital|restaurant|cafe|suite|salon|gym|bank|pharmacy|gas station|starbucks|mcdonald/)) return RIDE_PIN_ICONS.store;
      if (n.match(/tower|building|edificio|corporate|suite \d|floor \d|ste |bldg/)) return RIDE_PIN_ICONS.building;
      if (n.match(/\b\d+\b.*\b(dr|st|ave|blvd|ln|ct|rd|way|pl|cir|trl|pkwy)\b|apt|house|home|residence/i)) return RIDE_PIN_ICONS.home;
      return RIDE_PIN_ICONS.location;
    }
    function ridePinEl(kind, label) {
      var el = document.createElement('div');
      el.className = 'vipRide__marker' + (kind === 'dropoff' ? ' vipRide__marker--pulse' : '');
      var inner = document.createElement('div');
      inner.className = 'vipRide__markerInner';
      inner.innerHTML = rideGoldenPin(kind === 'pickup' ? RIDE_PIN_ICONS.person : rideDetectDropoffIcon(label || ''));
      el.appendChild(inner);
      if (kind === 'pickup') {
        var youLabel = document.createElement('div');
        youLabel.className = 'vipRide__youLabel';
        youLabel.textContent = isEsCity ? 'Tú' : 'You';
        el.appendChild(youLabel);
      }
      return el;
    }
    function clearRideDemo() {
      rideDemoReq++;   /* invalida cualquier ruta demo en curso */
      rideRouteCancelled = true;
      if (!rideMap) return;
      ['route-glow', 'route-casing', 'route-line'].forEach(function (lid) { try { if (rideMap.getLayer(lid)) rideMap.removeLayer(lid); } catch (e) {} });
      try { if (rideMap.getSource('route')) rideMap.removeSource('route'); } catch (e) {}
    }
    function placeRidePin(key, coord) {
      if (!rideMap) return;
      rideRouteCancelled = true;
      clearRideDemo();
      if (key === 'pickup') {
        if (ridePickupMarker) ridePickupMarker.remove();
        ridePickupMarker = new mapboxgl.Marker({ element: ridePinEl('pickup', rideSel.pickup && rideSel.pickup.label) }).setLngLat(coord).addTo(rideMap);
      } else {
        if (rideDropoffMarker) rideDropoffMarker.remove();
        rideDropoffMarker = new mapboxgl.Marker({ element: ridePinEl('dropoff', rideSel.dropoff && rideSel.dropoff.label) }).setLngLat(coord).addTo(rideMap);
      }
      if (rideSel.pickup && rideSel.dropoff) {
        var b = new mapboxgl.LngLatBounds();
        b.extend(rideSel.pickup.coord); b.extend(rideSel.dropoff.coord);
        rideMap.fitBounds(b, { padding: 90, duration: 1400, pitch: 50 });
      } else {
        rideMap.flyTo({ center: coord, zoom: 12.4, duration: 1600 });
      }
    }
    var rideWhen = { date: null, time: null };   /* elegidos en los desplegables Hoy/Ahora */
    function goToBooking() {
      if (!(rideSel.pickup && rideSel.dropoff)) return;
      var p = rideSel.pickup, d = rideSel.dropoff;
      var qs = '?pickup=' + encodeURIComponent(p.label) +
               '&pickupLat=' + p.coord[1] + '&pickupLng=' + p.coord[0] +
               '&dropoff=' + encodeURIComponent(d.label) +
               '&dropoffLat=' + d.coord[1] + '&dropoffLng=' + d.coord[0];
      if (rideWhen.date) qs += '&date=' + rideWhen.date;
      if (rideWhen.time) qs += '&time=' + rideWhen.time;
      setTimeout(function () { window.location.href = bookHref + qs; }, 500);
    }
    function setupRideField(fieldEl, key) {
      if (!fieldEl) return;
      var input = fieldEl.querySelector('input');
      var list = fieldEl.querySelector('.h-ride__sugg');
      if (!input || !list) return;
      var debT = null, items = [], activeIdx = -1;
      function closeList() { list.hidden = true; list.innerHTML = ''; items = []; activeIdx = -1; }
      function paintActive() {
        var btns = list.querySelectorAll('button');
        btns.forEach(function (b, i) { b.classList.toggle('is-active', i === activeIdx); });
      }
      function choose(i) {
        var f = items[i];
        if (!f) return;
        var p = f.properties || {};
        var name = p.name || '';
        var addr = p.full_address || p.place_formatted || '';
        var coord = f.geometry && f.geometry.coordinates;
        if (!coord) return;
        var label = addr && addr.indexOf(name) !== 0 ? name + ', ' + addr : (addr || name);
        input.value = label;
        rideSel[key] = { label: label, coord: coord };
        closeList();
        placeRidePin(key, coord);
        goToBooking();
      }
      function renderList(features) {
        items = features;
        activeIdx = -1;
        list.innerHTML = features.map(function (f, i) {
          var p = f.properties || {};
          return '<li><button type="button" data-i="' + i + '">' +
            '<span class="h-ride__suggPin">' + RIDE_CITY_ICONS.pin + '</span>' +
            '<span class="h-ride__suggTxt"><span class="h-ride__suggMain">' + escHtml(p.name || '') + '</span>' +
            '<span class="h-ride__suggSub">' + escHtml(p.full_address || p.place_formatted || '') + '</span></span>' +
            '</button></li>';
        }).join('');
        list.hidden = false;
      }
      input.addEventListener('input', function () {
        rideSel[key] = null;
        var q = input.value.trim();
        clearTimeout(debT);
        if (q.length < 3) { closeList(); return; }
        debT = setTimeout(function () {
          var url = 'https://api.mapbox.com/search/geocode/v6/forward?q=' + encodeURIComponent(q) +
            '&country=us' +
            '&proximity=' + (userPos ? (userPos.lng + ',' + userPos.lat) : curCity.coords.join(',')) +
            '&language=' + (isEsCity ? 'es' : 'en') +
            '&limit=5&types=address%2Cplace%2Clocality%2Cneighborhood' +
            '&access_token=' + mapboxgl.accessToken;
          fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            var feats = (data && data.features) || [];
            if (!feats.length) {
              list.innerHTML = '<li class="h-ride__suggEmpty">' + (isEsCity ? 'Sin resultados' : 'No results') + '</li>';
              list.hidden = false;
              items = [];
              return;
            }
            renderList(feats);
          }).catch(function () { closeList(); });
        }, 280);
      });
      input.addEventListener('keydown', function (ev) {
        if (list.hidden) return;
        if (ev.key === 'ArrowDown') { ev.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); paintActive(); }
        else if (ev.key === 'ArrowUp') { ev.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); paintActive(); }
        else if (ev.key === 'Enter') { ev.preventDefault(); choose(activeIdx >= 0 ? activeIdx : 0); }
        else if (ev.key === 'Escape') { closeList(); }
      });
      input.addEventListener('blur', function () { setTimeout(closeList, 160); });
      list.addEventListener('mousedown', function (ev) {
        var btn = ev.target.closest ? ev.target.closest('button[data-i]') : null;
        if (btn) { ev.preventDefault(); choose(parseInt(btn.getAttribute('data-i'), 10)); }
      });
    }
    setupRideField(rideFields[0], 'pickup');
    setupRideField(rideFields[1], 'dropoff');

    /* ---- desplegables de fecha (calendario) y hora (lista), estilo Uber ---- */
    (function setupWhenPickers() {
      var whenBox = document.querySelector('.h-ride__when');
      if (!whenBox) return;
      var pills = whenBox.querySelectorAll('.h-ride__pill');
      if (pills.length < 2) return;
      var datePill = pills[0], timePill = pills[1];
      var MONTHS = isEsCity
        ? ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var MONTHS_S = isEsCity
        ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var DOW = isEsCity ? ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      var T = {
        today: isEsCity ? 'Hoy' : 'Today',
        tomorrow: isEsCity ? 'Mañana' : 'Tomorrow',
        now: isEsCity ? 'Ahora' : 'Now'
      };
      function pad(n) { return (n < 10 ? '0' : '') + n; }
      function isoOf(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }
      var now0 = new Date();
      var todayISO = isoOf(now0.getFullYear(), now0.getMonth(), now0.getDate());
      var view = { y: now0.getFullYear(), m: now0.getMonth() };
      var sel = { date: null, time: null };   /* null = Hoy / Ahora */

      function wrapLabel(pill) {
        var sp = document.createElement('span');
        sp.className = 'h-ride__pill-tx';
        var nodes = pill.childNodes;
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].nodeType === 3 && nodes[i].textContent.trim()) {
            sp.textContent = nodes[i].textContent.trim();
            pill.replaceChild(sp, nodes[i]);
            return sp;
          }
        }
        pill.appendChild(sp);
        return sp;
      }
      var dateLabel = wrapLabel(datePill), timeLabel = wrapLabel(timePill);
      [datePill, timePill].forEach(function (pl) { pl.setAttribute('role', 'button'); pl.setAttribute('tabindex', '0'); });

      /* ---------- calendario ---------- */
      var cal = document.createElement('div');
      cal.className = 'h-when h-when--cal';
      cal.hidden = true;
      whenBox.appendChild(cal);

      function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }
      function paintCal() {
        var minY = now0.getFullYear(), minM = now0.getMonth();
        var maxDate = new Date(minY, minM + 12, 1);
        var atMin = (view.y === minY && view.m === minM);
        var atMax = (new Date(view.y, view.m, 1) >= maxDate);
        var html = '<div class="h-when__head">'
          + '<button type="button" class="h-when__nav" data-nav="-1"' + (atMin ? ' disabled' : '') + ' aria-label="‹"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>'
          + '<div class="h-when__selWrap"><select class="h-when__sel" data-sel="m" aria-label="month">';
        for (var mi = 0; mi < 12; mi++) html += '<option value="' + mi + '"' + (mi === view.m ? ' selected' : '') + '>' + MONTHS[mi] + '</option>';
        html += '</select><select class="h-when__sel" data-sel="y" aria-label="year">';
        for (var yi = minY; yi <= minY + 1; yi++) html += '<option value="' + yi + '"' + (yi === view.y ? ' selected' : '') + '>' + yi + '</option>';
        html += '</select></div>'
          + '<button type="button" class="h-when__nav" data-nav="1"' + (atMax ? ' disabled' : '') + ' aria-label="›"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>'
          + '</div><div class="h-when__dow">';
        DOW.forEach(function (d) { html += '<span>' + d + '</span>'; });
        html += '</div><div class="h-when__grid">';
        var first = new Date(view.y, view.m, 1).getDay();
        var total = daysIn(view.y, view.m);
        for (var b = 0; b < first; b++) html += '<span class="h-when__day h-when__day--blank"></span>';
        for (var d = 1; d <= total; d++) {
          var iso = isoOf(view.y, view.m, d);
          var cls = 'h-when__day';
          if (iso < todayISO) cls += ' h-when__day--past';
          if (iso === todayISO) cls += ' h-when__day--today';
          if (sel.date === iso) cls += ' h-when__day--sel';
          html += '<button type="button" class="' + cls + '" data-d="' + iso + '"' + (iso < todayISO ? ' disabled' : '') + '>' + d + '</button>';
        }
        cal.innerHTML = html + '</div>';
      }
      cal.addEventListener('click', function (ev) {
        var nav = ev.target.closest ? ev.target.closest('[data-nav]') : null;
        if (nav && !nav.disabled) {
          var base = now0.getFullYear() * 12 + now0.getMonth();
          var idx = view.y * 12 + view.m + parseInt(nav.getAttribute('data-nav'), 10);
          if (idx < base) idx = base;
          if (idx > base + 12) idx = base + 12;
          view.y = Math.floor(idx / 12);
          view.m = idx % 12;
          paintCal();
          return;
        }
        var day = ev.target.closest ? ev.target.closest('[data-d]') : null;
        if (day && !day.disabled) {
          sel.date = day.getAttribute('data-d');
          ensureSel();
          paintCal();
          paintDateLabel();
          paintTimeLabel();
          closePop();
        }
      });
      cal.addEventListener('change', function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute('data-sel')) return;
        var k = t.getAttribute('data-sel'), v = parseInt(t.value, 10);
        if (k === 'm') view.m = v; else view.y = v;
        var base = now0.getFullYear() * 12 + now0.getMonth();
        var idx2 = view.y * 12 + view.m;
        if (idx2 < base) idx2 = base;
        if (idx2 > base + 12) idx2 = base + 12;
        view.y = Math.floor(idx2 / 12);
        view.m = idx2 % 12;
        paintCal();
      });

      function paintDateLabel() {
        if (!sel.date || sel.date === todayISO) { dateLabel.textContent = T.today; return; }
        var tm = new Date(now0.getTime() + 86400000);
        if (sel.date === isoOf(tm.getFullYear(), tm.getMonth(), tm.getDate())) { dateLabel.textContent = T.tomorrow; return; }
        var p = sel.date.split('-');
        dateLabel.textContent = isEsCity
          ? parseInt(p[2], 10) + ' ' + MONTHS_S[parseInt(p[1], 10) - 1] + ' ' + p[0]
          : MONTHS_S[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
      }

      /* ---------- lista de horas: solo disponibles, próxima ya seleccionada ---------- */
      var tbox = document.createElement('div');
      tbox.className = 'h-when h-when--time';
      tbox.hidden = true;
      whenBox.appendChild(tbox);

      function fmt12(h, m) {
        var ap = h >= 12 ? 'PM' : 'AM';
        var hh = h % 12; if (hh === 0) hh = 12;
        return hh + ':' + pad(m) + ' ' + ap;
      }
      function slotStr(mins) { return pad(Math.floor(mins / 60)) + ':' + pad(mins % 60); }
      function firstSlotToday() {
        var nw = new Date();
        var slot = Math.ceil((nw.getHours() * 60 + nw.getMinutes() + 60) / 15) * 15;   /* siempre 1 h de antelación */
        return slot < 24 * 60 ? slot : null;
      }
      /* mantiene la selección válida: próxima hora disponible; si hoy ya no hay, mañana */
      function ensureSel() {
        if (!sel.date || sel.date === todayISO) {
          var s0 = firstSlotToday();
          if (s0 === null) {
            var tm = new Date(now0.getTime() + 86400000);
            sel.date = isoOf(tm.getFullYear(), tm.getMonth(), tm.getDate());
            sel.time = '00:00';
          } else if (!sel.time || (parseInt(sel.time.slice(0, 2), 10) * 60 + parseInt(sel.time.slice(3), 10)) < s0) {
            sel.time = slotStr(s0);
          }
        } else if (!sel.time) {
          sel.time = '00:00';
        }
        rideWhen.date = (sel.date === todayISO) ? null : sel.date;
        rideWhen.time = sel.time;
      }
      function paintTimeLabel() {
        if (sel.time) timeLabel.textContent = fmt12(parseInt(sel.time.slice(0, 2), 10), parseInt(sel.time.slice(3), 10));
      }
      function paintTimes() {
        ensureSel();
        var isToday = !sel.date || sel.date === todayISO;
        var minSlot = isToday ? firstSlotToday() : 0;
        var html = '';
        for (var mins = 0; mins < 24 * 60; mins += 15) {
          if (isToday && mins < minSlot) continue;   /* solo horarios disponibles */
          var h = Math.floor(mins / 60), m = mins % 60;
          var v = slotStr(mins);
          html += '<button type="button" class="h-when__t' + (sel.time === v ? ' h-when__t--sel' : '') + '" data-t="' + v + '">' + fmt12(h, m) + '</button>';
        }
        tbox.innerHTML = html;
        var cur = tbox.querySelector('.h-when__t--sel');
        if (cur) cur.scrollIntoView({ block: 'center' });
      }
      tbox.addEventListener('click', function (ev) {
        var b = ev.target.closest ? ev.target.closest('[data-t]') : null;
        if (!b) return;
        sel.time = b.getAttribute('data-t');
        rideWhen.time = sel.time;
        paintTimeLabel();
        paintTimes();
        closePop();
      });

      /* ---------- abrir / cerrar ---------- */
      function closePop() { cal.hidden = true; tbox.hidden = true; datePill.classList.remove('is-open'); timePill.classList.remove('is-open'); }
      function toggle(which) {
        var openCal = which === 'cal' && cal.hidden;
        closePop();
        if (which === 'cal') {
          if (openCal) {
            var d0 = sel.date ? sel.date.split('-') : null;
            if (d0) { view.y = parseInt(d0[0], 10); view.m = parseInt(d0[1], 10) - 1; }
            paintCal(); cal.hidden = false; datePill.classList.add('is-open');
          }
        } else if (which === 'time' && tbox.hidden) {
          paintTimes(); tbox.hidden = false; timePill.classList.add('is-open');
        }
      }
      datePill.addEventListener('click', function (ev) { ev.stopPropagation(); toggle('cal'); });
      timePill.addEventListener('click', function (ev) { ev.stopPropagation(); toggle('time'); });
      [datePill, timePill].forEach(function (pl) {
        pl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(pl === datePill ? 'cal' : 'time'); } });
      });
      cal.addEventListener('click', function (ev) { ev.stopPropagation(); });
      tbox.addEventListener('click', function (ev) { ev.stopPropagation(); });
      document.addEventListener('click', closePop);
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closePop(); });

      /* por defecto: hoy + próxima hora disponible ya seleccionada */
      ensureSel();
      paintTimeLabel();
    })();

    /* ---- geolocalización en tiempo real: rellena la recogida con tu
           ubicación actual y detecta la ciudad y estado exactos ---- */
    function reverseGeocode(lng, lat, cb) {
      var url = 'https://api.mapbox.com/search/geocode/v6/reverse?longitude=' + lng + '&latitude=' + lat +
        '&language=' + (isEsCity ? 'es' : 'en') +
        '&access_token=' + mapboxgl.accessToken;
      fetch(url).then(function (r) { return r.json(); })
        .then(function (d) { cb && cb((d && d.features) || []); })
        .catch(function () { cb && cb([]); });
    }
    function nearestCity(lng, lat) {
      var best = null, bd = 1e9;
      RIDE_CITIES.forEach(function (c) {
        var d = Math.abs(c.coords[0] - lng) + Math.abs(c.coords[1] - lat);
        if (d < bd) { bd = d; best = c; }
      });
      return { city: best, dist: bd };
    }
    function applyUserLocation(lng, lat, isFirstFix) {
      userPos = { lat: lat, lng: lng };
      reverseGeocode(lng, lat, function (feats) {
        if (!feats.length) return;
        var f = feats[0];
        var p = f.properties || {};
        var ctx = p.context || {};
        /* ciudad y estado exactos desde el contexto */
        var city = ctx.place && ctx.place.name;
        var region = ctx.region && (ctx.region.region_code || ctx.region.short_code || ctx.region.name || '');
        region = String(region).replace(/^US-/, '');
        if (city && region && !manualCity) {
          if (RIDE_CITIES.indexOf(curCity) === -1) curCity.coords = [lng, lat];
          document.querySelectorAll('.h-ride__cityName').forEach(function (el) {
            el.textContent = city + ', ' + region + ', US';
          });
          var cc = document.querySelector('.h-city__current');
          if (cc) cc.textContent = city;
        }
        if (isFirstFix) {
          var addr = p.full_address || p.place_formatted || '';
          if (addr && rideFields[0] && !rideSel.pickup) {
            var inp = rideFields[0].querySelector('input');
            if (inp) inp.value = addr;
            rideSel.pickup = { label: addr, coord: [lng, lat] };
          }
          /* demo en vivo: tu ubicación → aeropuerto de tu ciudad */
          var nc = nearestCity(lng, lat);
          if (nc.city && nc.dist < 1.6) {
            if (!manualCity) {
              curCity = nc.city;
              renderSugs(nc.city);
              var cc2 = document.querySelector('.h-city__current');
              if (cc2 && !city) cc2.textContent = nc.city[document.documentElement.lang === 'en' ? 'en' : 'es'];
            }
            if (typeof rideDemoRoute === 'function') rideDemoRoute([lng, lat], nc.city, true);
            else { placeRidePin('pickup', [lng, lat]); if (rideMap) rideMap.flyTo({ center: [lng, lat], zoom: 12.4, duration: 1800 }); }
          } else {
            rideRouteCancelled = true;
            placeRidePin('pickup', [lng, lat]);
            if (rideMap) rideMap.flyTo({ center: [lng, lat], zoom: 12.4, duration: 1800 });
          }
        }
      });
    }
    if (navigator.geolocation) {
      var geoOpts = { enableHighAccuracy: true, timeout: 9000, maximumAge: 30000 };
      navigator.geolocation.getCurrentPosition(
        function (pos) { applyUserLocation(pos.coords.longitude, pos.coords.latitude, true); },
        function () {},
        geoOpts
      );
      /* seguimiento en tiempo real: si te mueves, se actualiza */
      var lastFix = null, firstDone = false;
      geoWatchId = navigator.geolocation.watchPosition(
        function (pos) {
          var lng = pos.coords.longitude, lat = pos.coords.latitude;
          if (lastFix && Math.abs(lng - lastFix[0]) + Math.abs(lat - lastFix[1]) < 0.002) return; /* ~200 m */
          lastFix = [lng, lat];
          applyUserLocation(lng, lat, !firstDone);
          firstDone = true;
        },
        function () {},
        geoOpts
      );
    }
  }

  /* ---- header: transparente en hero, glass sedoso al scroll ---- */
  var header = document.querySelector('.cruise-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('ch-scrolled', window.scrollY > 50);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- formulario de contacto -> WhatsApp ---- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var es = document.documentElement.lang !== 'en';
      var lines = es
        ? ['Nuevo mensaje desde la web:', '',
           'Nombre: ' + d.get('name'),
           'Email: ' + d.get('email'),
           'Asunto: ' + d.get('subject'), '',
           d.get('message')]
        : ['New message from the website:', '',
           'Name: ' + d.get('name'),
           'Email: ' + d.get('email'),
           'Subject: ' + d.get('subject'), '',
           d.get('message')];
      window.open('https://wa.me/16593052974?text=' +
        encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* token de Mapbox compartido por el comparador y el mapa de cobertura */
  var MAPBOX_TOKEN = 'pk.eyJ1Ijoicm95YWxwdXJwbGVjb3JwIiwiYSI6ImNtbHk4cmpsNjExamwzZm9sOGFobXZoZTMifQ.YNkz-m3W7noKKDKbwn9y3w';

  /* ---- comparador de viaje (seccion "Compara tus opciones de viaje") -------
     Geocoding + Directions de Mapbox con el mismo token del mapa. Las tarifas,
     los textos y las opciones vienen del JSON que inyecta build_home.py, para
     no duplicar traducciones ni precios aqui. */
  var tripForm = document.getElementById('tripForm');
  var tripCfgEl = document.getElementById('tripConfig');
  if (tripForm && tripCfgEl && window.mapboxgl) {
    var CFG = JSON.parse(tripCfgEl.textContent);
    var L = CFG.labels;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    var el = function (id) { return document.getElementById(id); };
    var ui = {
      from: el('tripFrom'), to: el('tripTo'),
      fromSugg: el('tripFromSugg'), toSugg: el('tripToSugg'),
      date: el('tripDate'), time: el('tripTime'),
      dur: el('tripDur'), durWrap: el('tripDurWrap'),
      geo: el('tripGeo'), msg: el('tripMsg'),
      results: el('tripResults'), summary: el('tripSummary'),
      submit: tripForm.querySelector('.cmp-submit'),
      seg: tripForm.querySelector('.cmp-seg')
    };
    /* from/to guardan {name, coord}; last guarda la ultima ruta calculada para
       poder recalcular precios al cambiar de ida a ida y vuelta sin volver a la red */
    var st = { trip: 'one', from: null, to: null, last: null };

    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };

    /* la fecha arranca en hoy y no deja elegir dias pasados */
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    ui.date.value = iso;
    ui.date.min = iso;

    /* ---- mapa: mismo diseno, camara y pines que el de book.html ---- */
    var tMap = new mapboxgl.Map({
      container: 'tripMap',
      style: 'mapbox://styles/mapbox/dark-v11',
      center: CFG.center,
      zoom: 10.4,
      pitch: 0,
      bearing: 0,
      maxPitch: 55,
      attributionControl: false,
      antialias: true,
      renderWorldCopies: false,
      /* solo se mira: nada de arrastrar, hacer zoom, rotar ni enfocar con
         teclado. La camara sigue moviendose desde el codigo (easeTo/fitBounds). */
      interactive: false
    });
    var mapReady = false, pending = null, pins = { from: null, to: null };

    var _sp = function (id, prop, val) {
      try { if (tMap.getLayer(id)) tMap.setPaintProperty(id, prop, val); } catch (e) { /* noop */ }
    };
    /* la base azul noche se aplica ya en style.load para que no se vea el gris
       de dark-v11 mientras cargan las teselas */
    var paintBase = function () {
      _sp('background', 'background-color', '#0A1128');
      _sp('land', 'background-color', '#0A1128');
      _sp('landcover', 'fill-color', '#0F1A36');
      _sp('landuse', 'fill-color', '#0F1A36');
      _sp('water', 'fill-color', '#070E22');
      _sp('water-shadow', 'fill-color', '#070E22');
      _sp('building', 'fill-color', '#111D3A');
      _sp('building-outline', 'fill-color', '#111D3A');
    };
    tMap.on('style.load', paintBase);

    /* pin dorado identico al de la reserva */
    var PIN_PERSON = '<circle cx="24" cy="14" r="2.8" fill="#fff"/><path d="M19.5 22.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill="#fff" stroke="#fff" stroke-width=".5" stroke-linecap="round"/>';
    var PIN_PLACE = '<path d="M24 12c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5z" fill="#fff"/><circle cx="24" cy="17.5" r="2" fill="#0a1128"/>';
    var goldenPin = function (iconPath) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 46" fill="none" width="48" height="46">' +
        '<defs><linearGradient id="pg" x1="24" y1="2" x2="24" y2="44" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#F5DC7A"/><stop offset=".45" stop-color="#D4A800"/><stop offset="1" stop-color="#B08800"/>' +
        '</linearGradient><radialGradient id="ph" cx="24" cy="16.3" r="17" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#E8C547" stop-opacity=".22"/><stop offset=".5" stop-color="#E8C547" stop-opacity=".06"/><stop offset="1" stop-color="#E8C547" stop-opacity="0"/>' +
        '</radialGradient><radialGradient id="pw" cx="24" cy="16.3" r="11" gradientUnits="userSpaceOnUse">' +
        '<stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".3" stop-color="#fff" stop-opacity=".18"/><stop offset=".65" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</radialGradient><filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.5"/></filter></defs>' +
        '<circle cx="24" cy="16.3" r="17" fill="url(#ph)"/>' +
        '<circle cx="24" cy="16.3" r="11" fill="url(#pw)"/>' +
        '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="#D4A800" opacity=".4" filter="url(#ps)"/>' +
        '<path d="M36.2 24 A14.4 14.4 0 0 1 11.8 24 Q13 36.2 24 43.7 Q35 36.2 36.2 24Z" fill="url(#pg)"/>' +
        '<path d="M32.3 22.6 A10.4 10.4 0 0 1 15.7 22.6 Q24 26.2 32.3 22.6Z" fill="#0a1128"/>' +
        '<path d="M35.5 23.5 A13.8 13.8 0 0 0 30.5 13" stroke="#fff" stroke-opacity=".28" stroke-width=".8" fill="none" stroke-linecap="round"/>' +
        iconPath + '</svg>';
    };
    var pinEl = function (kind) {
      var el = document.createElement('div');
      el.className = 'vipRide__marker' + (kind === 'to' ? ' vipRide__marker--pulse' : '');
      var inner = document.createElement('div');
      inner.className = 'vipRide__markerInner';
      inner.innerHTML = goldenPin(kind === 'to' ? PIN_PLACE : PIN_PERSON);
      el.appendChild(inner);
      if (kind === 'from') {
        var tag = document.createElement('div');
        tag.className = 'vipRide__youLabel';
        tag.textContent = document.documentElement.lang === 'en' ? 'You' : 'Tú';
        el.appendChild(tag);
      }
      return el;
    };

    tMap.on('load', function () {
      var logo = tMap.getContainer().querySelector('.mapboxgl-ctrl-logo');
      if (logo) logo.style.display = 'none';
      paintBase();


      /* edificios en 3D por debajo de la primera capa de etiquetas */
      try {
        var lbl = null, lys = tMap.getStyle().layers;
        for (var i = 0; i < lys.length; i++) {
          if (lys[i].type === 'symbol' && lys[i].layout && lys[i].layout['text-field']) { lbl = lys[i].id; break; }
        }
        tMap.addLayer({
          id: 'vr3dB', source: 'composite', 'source-layer': 'building',
          filter: ['all', ['==', 'extrude', 'true'], ['has', 'height']],
          type: 'fill-extrusion', minzoom: 15,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#1a2548', 40, '#3d4f8c', 150, '#8a6e1c'],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.8, ['get', 'height']],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': .6,
            'fill-extrusion-vertical-gradient': true
          }
        }, lbl);
      } catch (e) { /* noop */ }

      /* autopistas en dorado, el resto de la red en grises */
      var GOLD = '#D4AF37', GOLD_CASE = '#B8960C';
      var GREY_ROAD = '#2A2E3A', GREY_MINOR = '#1E2128', GREY_CASE = '#161820';
      try {
        tMap.getStyle().layers.forEach(function (l) {
          if (!l || !l.id || l.type !== 'line') return;
          var id = l.id;
          if (/label|shield|number/.test(id)) return;
          if (/(motorway|trunk|highway)/i.test(id)) {
            _sp(id, 'line-color', /case/.test(id) ? GOLD_CASE : GOLD);
          } else if (/(primary|secondary|tertiary)/.test(id)) {
            _sp(id, 'line-color', /case/.test(id) ? GREY_CASE : GREY_ROAD);
          } else if (/(street|minor|service|path|pedestrian)/.test(id)) {
            _sp(id, 'line-color', /case/.test(id) ? GREY_CASE : GREY_MINOR);
          }
        });
      } catch (e) { /* noop */ }

      ['settlement-label', 'settlement-subdivision-label', 'settlement-minor-label'].forEach(function (id) {
        _sp(id, 'text-color', '#8090b0');
        _sp(id, 'text-halo-color', '#0a0e1a');
        _sp(id, 'text-halo-width', 2);
      });
      ['state-label', 'country-label'].forEach(function (id) {
        _sp(id, 'text-color', '#6a7a98');
        _sp(id, 'text-halo-color', '#0a0e1a');
      });

      mapReady = true;
      if (pending) { drawRoute(pending); pending = null; }
    });

    /* ruta: sombra + resplandor + canto + linea con degradado dorado, y se
       traza sola con line-trim-offset, exactamente como en la reserva */
    var RT_LAYERS = ['route-shadow', 'route-glow', 'route-casing', 'route-line'];
    var clearRoute = function () {
      try {
        RT_LAYERS.forEach(function (id) { if (tMap.getLayer(id)) tMap.removeLayer(id); });
        if (tMap.getSource('route')) tMap.removeSource('route');
      } catch (e) { /* noop */ }
    };
    var drawRoute = function (r) {
      if (!mapReady) { pending = r; return; }
      clearRoute();
      var coords = r.geometry.coordinates;
      if (!coords || coords.length < 2) return;

      tMap.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
        lineMetrics: true
      });
      var LO = { 'line-cap': 'round', 'line-join': 'round' }, TR = [0, 1];
      tMap.addLayer({ id: 'route-shadow', type: 'line', source: 'route', layout: LO,
        paint: { 'line-color': '#000', 'line-width': 12, 'line-opacity': .55, 'line-blur': 6, 'line-translate': [0, 4], 'line-trim-offset': TR } });
      tMap.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: LO,
        paint: { 'line-color': '#D4AF37', 'line-width': 16, 'line-opacity': .22, 'line-blur': 12, 'line-trim-offset': TR } });
      tMap.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: LO,
        paint: { 'line-color': '#1a0f00', 'line-width': 7, 'line-opacity': .85, 'line-trim-offset': TR } });
      tMap.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: LO,
        paint: { 'line-width': 5, 'line-opacity': .96, 'line-trim-offset': TR,
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#D4AF37', .5, '#FFD700', 1, '#E8C547'] } });

      ['from', 'to'].forEach(function (k) {
        if (pins[k]) pins[k].remove();
        pins[k] = new mapboxgl.Marker({ element: pinEl(k), anchor: 'center' })
          .setLngLat(st[k].coord).addTo(tMap);
      });

      var b = new mapboxgl.LngLatBounds();
      coords.forEach(function (c) { b.extend(c); });
      tMap.fitBounds(b, {
        padding: { top: 130, bottom: 110, left: 80, right: 80 },
        pitch: 0, bearing: 0, duration: 1200
      });

      var t0 = performance.now(), dur = 3500;
      var tick = function (now) {
        var t = Math.min(1, (now - t0) / dur);
        var p = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        RT_LAYERS.forEach(function (id) {
          if (tMap.getLayer(id)) tMap.setPaintProperty(id, 'line-trim-offset', [p, 1]);
        });
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          /* la ruta ya esta dibujada: entonces se inclina la camara */
          tMap.easeTo({ pitch: 55, duration: 2400 });
        }
      };
      requestAnimationFrame(tick);
    };

    /* ---- geocoding ---- */
    var geocode = function (q) {
      var url = 'https://api.mapbox.com/search/geocode/v6/forward?q=' + encodeURIComponent(q) +
        '&country=us&limit=5&proximity=' + CFG.center.join(',') +
        '&access_token=' + MAPBOX_TOKEN;
      return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        return (j.features || []).map(function (f) {
          var p = f.properties || {};
          return { name: p.full_address || p.name_preferred || p.name || q, coord: f.geometry.coordinates };
        });
      });
    };

    var suggest = function (input, list, key) {
      var timer = 0;
      var close = function () { list.hidden = true; list.innerHTML = ''; list._items = null; };
      input.addEventListener('input', function () {
        st[key] = null;
        clearTimeout(timer);
        var q = input.value.trim();
        if (q.length < 3) { close(); return; }
        timer = setTimeout(function () {
          geocode(q).then(function (items) {
            if (!items.length) { close(); return; }
            list._items = items;
            list.innerHTML = items.map(function (it, i) {
              return '<li><button type="button" data-i="' + i + '">' + esc(it.name) + '</button></li>';
            }).join('');
            list.hidden = false;
          }).catch(close);
        }, 280);
      });
      list.addEventListener('mousedown', function (e) {
        var btn = e.target.closest ? e.target.closest('button[data-i]') : null;
        if (!btn || !list._items) return;
        e.preventDefault();
        var it = list._items[Number(btn.getAttribute('data-i'))];
        input.value = it.name;
        st[key] = it;
        close();
      });
      input.addEventListener('blur', function () { setTimeout(close, 120); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });
    };
    suggest(ui.from, ui.fromSugg, 'from');
    suggest(ui.to, ui.toSugg, 'to');

    /* si el usuario escribio pero no eligio sugerencia, se toma el primer resultado */
    var resolvePoint = function (key, input) {
      if (st[key]) return Promise.resolve(st[key]);
      var q = input.value.trim();
      if (!q) return Promise.resolve(null);
      return geocode(q).then(function (items) {
        if (!items.length) return null;
        st[key] = items[0];
        input.value = items[0].name;
        return items[0];
      });
    };

    /* ---- boton de ubicacion actual ---- */
    ui.geo.addEventListener('click', function () {
      if (!navigator.geolocation) { say(L.errGeo, true); return; }
      say(L.calc);
      navigator.geolocation.getCurrentPosition(function (pos) {
        var c = [pos.coords.longitude, pos.coords.latitude];
        fetch('https://api.mapbox.com/search/geocode/v6/reverse?longitude=' + c[0] +
          '&latitude=' + c[1] + '&limit=1&access_token=' + MAPBOX_TOKEN)
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var f = (j.features || [])[0];
            var name = f ? (f.properties.full_address || f.properties.name) : c[1].toFixed(4) + ', ' + c[0].toFixed(4);
            st.from = { name: name, coord: c };
            ui.from.value = name;
            say('');
          })
          .catch(function () { say(L.errGeo, true); });
      }, function () { say(L.errGeo, true); });
    });

    /* ---- segmentado ida / ida y vuelta ---- */
    ui.seg.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.cmp-seg__btn') : null;
      if (!btn) return;
      st.trip = btn.getAttribute('data-trip');
      Array.prototype.forEach.call(ui.seg.querySelectorAll('.cmp-seg__btn'), function (x) {
        var on = x === btn;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      ui.seg.classList.toggle('is-round', st.trip === 'round');
      ui.durWrap.classList.toggle('is-off', st.trip !== 'round');
      ui.dur.disabled = st.trip !== 'round';
      if (st.last) render(st.last);      /* recalcula precios sin volver a pedir la ruta */
    });

    /* ---- precios ---- */
    var money = function (n) {
      return '$' + Math.round(n).toLocaleString('en-US');
    };
    var priceFor = function (key, miles, mins) {
      var f = CFG.fares[key];
      var legs = st.trip === 'round' ? 2 : 1;
      if (f.hourly) {
        var hours = Math.max(f.minHours, Math.ceil((mins * legs) / 60));
        return { text: money(f.hourly * hours), note: L.hourlyNote.replace('{h}', f.minHours) };
      }
      var one = Math.max(f.min, f.base + miles * f.perMile + mins * f.perMin);
      var total = one * legs;
      return {
        text: money(total * 0.92) + ' – ' + money(total * 1.12),
        note: legs === 2 ? L.roundNote : ''
      };
    };

    var fmtMins = function (m) {
      var h = Math.floor(m / 60), r = Math.round(m % 60);
      return h ? h + ' h ' + r + ' min' : r + ' min';
    };

    var say = function (text, isErr) {
      ui.msg.textContent = text || '';
      ui.msg.classList.toggle('is-err', !!isErr);
    };

    var render = function (r) {
      var miles = r.distance / 1609.344;
      var mins = r.duration / 60;
      var legs = st.trip === 'round' ? 2 : 1;

      ui.summary.innerHTML =
        '<div><span>' + esc(L.dist) + '</span><strong>' + (miles * legs).toFixed(1) + ' mi</strong></div>' +
        '<div><span>' + esc(L.eta) + '</span><strong>' + fmtMins(mins * legs) + '</strong></div>';
      ui.summary.hidden = false;

      var q = '?from=' + encodeURIComponent(st.from.name) +
        '&to=' + encodeURIComponent(st.to.name) +
        '&date=' + encodeURIComponent(ui.date.value) +
        '&time=' + encodeURIComponent(ui.time.value) +
        '&trip=' + st.trip +
        (st.trip === 'round' ? '&days=' + encodeURIComponent(ui.dur.value) : '');

      var rows = CFG.options.map(function (o) {
        var p = priceFor(o.key, miles, mins);
        return '<div class="cmp-opt">' +
          '<span class="cmp-opt__name">' + esc(o.name) + '</span>' +
          '<span class="cmp-opt__meta">' + esc(o.car) + ' · ' + esc(o.seats) +
            (p.note ? ' · ' + esc(p.note) : '') + '</span>' +
          '<span class="cmp-opt__price"><b>' + p.text + '</b>' +
          '<a href="' + CFG.book + q + '&option=' + o.key + '">' + esc(L.book) + '</a></span>' +
          '</div>';
      }).join('');

      ui.results.innerHTML =
        '<div class="cmp-results__head"><h4>' + esc(L.results) + '</h4>' +
        '<span class="cmp-results__trip">' + fmtMins(mins * legs) + ' · ' +
          (miles * legs).toFixed(1) + ' mi</span></div>' +
        rows + '<p class="cmp-note">' + esc(L.note) + '</p>';
      ui.results.hidden = false;
    };

    /* ---- envio ---- */
    tripForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!ui.from.value.trim() || !ui.to.value.trim()) { say(L.errFields, true); return; }
      say(L.calc);
      ui.submit.disabled = true;
      Promise.all([resolvePoint('from', ui.from), resolvePoint('to', ui.to)])
        .then(function (pts) {
          if (!pts[0] || !pts[1]) throw new Error('geocode');
          var url = 'https://api.mapbox.com/directions/v5/mapbox/driving-traffic/' +
            pts[0].coord.join(',') + ';' + pts[1].coord.join(',') +
            '?geometries=geojson&overview=full&access_token=' + MAPBOX_TOKEN;
          return fetch(url).then(function (r) { return r.json(); });
        })
        .then(function (j) {
          if (!j.routes || !j.routes.length) throw new Error('route');
          st.last = j.routes[0];
          drawRoute(st.last);
          render(st.last);
          say('');
        })
        .catch(function () { say(L.errRoute, true); })
        .then(function () { ui.submit.disabled = false; });
    });
  }

  /* ---- mapa de cobertura (Mapbox GL JS): colores de mapa normal, sin controles ni etiquetas ----
     Los poligonos son los contornos reales (US Census cartographic boundaries, recortados a
     la linea de costa) de Alabama y del Sur de Florida: solo terreno, sin mar ni lagos.
     Las zonas se dibujan como una placa en relieve: sombra proyectada + canto + cara superior. */
  var covMapEl = document.getElementById('covMap');
  if (covMapEl && window.mapboxgl) {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    var MAP_BG = '#f2efe9';   /* tono del mapa mientras cargan los tiles */
    var SHADOW = '#2f2a20';   /* sombra proyectada bajo cada zona        */

    covMapEl.style.background = MAP_BG;

    /* leyenda flotante: se inyecta desde aqui para que no dependa del HTML */
    var covWrap = covMapEl.parentNode;
    if (covWrap && !covWrap.querySelector('.cov-legend')) {
      var covEs = document.documentElement.lang !== 'en';
      var covLegend = document.createElement('div');
      covLegend.className = 'cov-legend';
      covLegend.innerHTML =
        '<strong class="cov-legend__title">' +
          (covEs ? 'Zonas de cobertura' : 'Coverage areas') + '</strong>' +
        '<span class="cov-legend__row"><i style="--sw:#f7c948"></i>Alabama</span>' +
        '<span class="cov-legend__row"><i style="--sw:#f0902d"></i>' +
          (covEs ? 'Sur de Florida' : 'South Florida') + '</span>';
      covWrap.appendChild(covLegend);
    }

    var map = new mapboxgl.Map({
      container: 'covMap',
      style: 'mapbox://styles/mapbox/streets-v12',
      projection: 'mercator',
      center: [-84.5, 30.2],
      zoom: 4.6,
      attributionControl: false,
      logoPosition: 'bottom-right',
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoomRotate: false
    });

    map.on('load', function () {
      map._logoControl && map._logoControl._updateLogo();
      var logo = covMapEl.querySelector('.mapboxgl-ctrl-logo');
      if (logo) logo.style.display = 'none';

      /* se conservan carreteras, fronteras y etiquetas del estilo;
         solo se quitan los POI y el transporte, que ensucian a este zoom */
      map.getStyle().layers.forEach(function (layer) {
        if (/poi|transit|airport|natural-point|water-point/.test(layer.id)) {
          try { map.setLayoutProperty(layer.id, 'visibility', 'none'); } catch (e) { /* noop */ }
        }
      });

      /* paleta suave: terreno crema y agua azul palido en lugar del verde saturado */
      var tune = function (id, prop, value) {
        if (!map.getLayer(id)) return;
        try { map.setPaintProperty(id, prop, value); } catch (e) { /* noop */ }
      };
      tune('land', 'background-color', '#f7f3ea');
      tune('water', 'fill-color', '#c3dfea');
      tune('water-shadow', 'fill-color', '#c3dfea');
      tune('waterway', 'line-color', '#c3dfea');
      /* water-depth pinta la batimetria encima del agua; se quita para dejarla plana */
      tune('water-depth', 'fill-opacity', 0);
      /* landcover se clampa a 0.4 por debajo de zoom 9 y tine el terreno de verde;
         a este zoom sobra: el terreno queda crema */
      tune('landcover', 'fill-opacity', 0);
      tune('national-park', 'fill-opacity', 0);

      /* Alabama y Sur de Florida con su geometria real (solo terreno) */
      map.addSource('coverage', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { name: 'Alabama', fill: '#f7c948', edge: '#e2941f' },
              geometry: { type: 'MultiPolygon', coordinates: [
                [
                  [[-88.0596,30.6191],[-88.054,30.6125],[-88.0649,30.5883],[-88.0749,30.5789],
                   [-88.0855,30.5633],[-88.0816,30.5463],[-88.0828,30.5287],[-88.0907,30.5236],
                   [-88.1009,30.5098],[-88.1038,30.5009],[-88.0969,30.4711],[-88.1064,30.4527],
                   [-88.1041,30.4273],[-88.1073,30.3772],[-88.1154,30.3566],[-88.1281,30.3385],
                   [-88.1362,30.3207],[-88.1558,30.3272],[-88.172,30.3247],[-88.1915,30.317],
                   [-88.1957,30.3212],[-88.1984,30.3388],[-88.1964,30.3436],[-88.1885,30.3451],
                   [-88.1885,30.3481],[-88.2001,30.3624],[-88.2045,30.3621],[-88.2607,30.3824],
                   [-88.2826,30.3829],[-88.2906,30.3707],[-88.3116,30.3689],[-88.3165,30.37],
                   [-88.3196,30.3803],[-88.3323,30.3884],[-88.364,30.388],[-88.3747,30.3856],
                   [-88.395,30.3694],[-88.4257,31.0002],[-88.4644,31.6979],[-88.4712,31.8514],
                   [-88.4689,31.9303],[-88.4038,32.4498],[-88.2544,33.6988],[-88.0979,34.8922],
                   [-88.125,34.9022],[-88.2001,34.9956],[-88.1825,35.0077],[-87.3913,35.0024],
                   [-86.8621,34.992],[-86.3972,34.9917],[-85.8244,34.9881],[-85.6052,34.9847],
                   [-85.5831,34.8604],[-85.5525,34.7081],[-85.4554,34.2529],[-85.2324,33.1081],
                   [-85.1841,32.8705],[-85.1234,32.7722],[-85.132,32.7642],[-85.1371,32.7452],
                   [-85.1147,32.6856],[-85.1048,32.6425],[-85.0696,32.5839],[-85.0446,32.5595],
                   [-85.0225,32.5429],[-85.0071,32.5239],[-85.0013,32.513],[-84.9982,32.4698],
                   [-84.9838,32.4456],[-84.9794,32.4122],[-84.9874,32.3812],[-85.0081,32.3367],
                   [-85.0071,32.3284],[-85.0019,32.322],[-84.9387,32.3007],[-84.9166,32.2812],
                   [-84.9091,32.2635],[-84.9216,32.2333],[-84.9648,32.195],[-84.9959,32.1849],
                   [-85.0479,32.142],[-85.056,32.0631],[-85.0502,32.0242],[-85.055,32.0113],
                   [-85.054,32.0331],[-85.0577,32.0472],[-85.0693,32.0528],[-85.0693,32.0467],
                   [-85.062,32.0331],[-85.064,32.014],[-85.0736,31.9957],[-85.0883,31.9851],
                   [-85.1108,31.9928],[-85.1176,31.9981],[-85.1461,32.0325],[-85.1587,32.0399],
                   [-85.1589,32.019],[-85.1544,32.0069],[-85.1194,31.9704],[-85.1132,31.956],
                   [-85.1166,31.941],[-85.1308,31.9224],[-85.1247,31.9224],[-85.1325,31.9033],
                   [-85.1389,31.8774],[-85.1467,31.8621],[-85.1587,31.8742],[-85.1718,31.8332],
                   [-85.1513,31.817],[-85.1414,31.792],[-85.1413,31.7832],[-85.136,31.7777],
                   [-85.137,31.7364],[-85.1656,31.7102],[-85.1438,31.7017],[-85.1217,31.6893],
                   [-85.1096,31.6719],[-85.1177,31.649],[-85.099,31.6384],[-85.0764,31.6329],
                   [-85.0595,31.6217],[-85.0413,31.541],[-85.0681,31.4276],[-85.0877,31.3087],
                   [-85.1016,31.2834],[-85.1119,31.2584],[-85.1075,31.1865],[-85.1002,31.1655],
                   [-85.0921,31.1603],[-85.0766,31.1569],[-85.0356,31.1082],[-84.9994,31.0138],
                   [-85.0024,31.0007],[-86.0562,30.9931],[-86.5199,30.9932],[-87.04,30.9996],
                   [-87.5989,30.9975],[-87.5941,30.9763],[-87.6014,30.9363],[-87.6222,30.8975],
                   [-87.6349,30.8659],[-87.6241,30.8457],[-87.5326,30.7435],[-87.5029,30.7224],
                   [-87.4812,30.7165],[-87.4071,30.6718],[-87.397,30.6536],[-87.3942,30.6417],
                   [-87.3945,30.6252],[-87.4499,30.5147],[-87.4306,30.4911],[-87.4192,30.4102],
                   [-87.4275,30.4084],[-87.4407,30.3915],[-87.4514,30.3672],[-87.4501,30.3111],
                   [-87.4524,30.3002],[-87.5183,30.2804],[-87.5581,30.2744],[-87.6569,30.2497],
                   [-87.7355,30.2407],[-87.8006,30.2294],[-87.8385,30.2272],[-87.9261,30.2304],
                   [-87.9623,30.2295],[-88.0284,30.2211],[-88.024,30.2304],[-87.9668,30.2356],
                   [-87.949,30.2566],[-87.936,30.2615],[-87.9182,30.2533],[-87.9138,30.2478],
                   [-87.8932,30.2392],[-87.8601,30.2403],[-87.8177,30.2543],[-87.7878,30.2542],
                   [-87.7666,30.2624],[-87.7553,30.2773],[-87.7555,30.2912],[-87.7728,30.3117],
                   [-87.8093,30.3327],[-87.8299,30.3538],[-87.8372,30.3693],[-87.8451,30.3774],
                   [-87.8538,30.3785],[-87.865,30.3834],[-87.9063,30.4094],[-87.9089,30.4142],
                   [-87.92,30.4706],[-87.9319,30.4811],[-87.9334,30.4874],[-87.9111,30.5258],
                   [-87.9017,30.5509],[-87.9042,30.566],[-87.915,30.5859],[-87.9125,30.6158],
                   [-87.9193,30.6361],[-87.9311,30.6527],[-87.9367,30.6574],[-87.956,30.6589],
                   [-87.9812,30.6751],[-88.0084,30.685],[-88.0221,30.6739],[-88.0267,30.6615],
                   [-88.0346,30.6537],[-88.0443,30.6526],[-88.062,30.6449],[-88.0596,30.6191]],
                  [[-86.294,33.5258],[-86.2892,33.5191],[-86.2892,33.5129],[-86.3034,33.5002],
                   [-86.3142,33.4858],[-86.3301,33.4446],[-86.2711,33.4393],[-86.2555,33.4446],
                   [-86.2555,33.4514],[-86.2925,33.4575],[-86.2956,33.4608],[-86.2956,33.4749],
                   [-86.2906,33.4805],[-86.2702,33.4902],[-86.2481,33.4923],[-86.2251,33.5073],
                   [-86.1816,33.5509],[-86.1593,33.56],[-86.1604,33.5644],[-86.1661,33.5741],
                   [-86.1779,33.5676],[-86.1894,33.5676],[-86.1978,33.5744],[-86.2003,33.5879],
                   [-86.2094,33.5938],[-86.2166,33.5944],[-86.2226,33.59],[-86.2276,33.5818],
                   [-86.2291,33.5691],[-86.2216,33.5644],[-86.2119,33.562],[-86.2072,33.5567],
                   [-86.2126,33.5411],[-86.239,33.522],[-86.2481,33.5052],[-86.255,33.5129],
                   [-86.2672,33.5353],[-86.2792,33.54],[-86.289,33.5379],[-86.2939,33.5326],
                   [-86.294,33.5258]],
                  [[-86.4943,32.9136],[-86.5018,32.9501],[-86.4883,32.9777],[-86.4759,32.9922],
                   [-86.4746,32.9989],[-86.4964,32.9904],[-86.5085,32.9969],[-86.5219,33.0325],
                   [-86.5283,33.0075],[-86.5267,32.9754],[-86.5194,32.9427],[-86.5088,32.9162],
                   [-86.477,32.8771],[-86.4673,32.8617],[-86.4553,32.8517],[-86.4528,32.8444],
                   [-86.4721,32.8394],[-86.4793,32.8344],[-86.4883,32.8208],[-86.4708,32.8241],
                   [-86.4494,32.8079],[-86.4337,32.8208],[-86.4377,32.8202],[-86.4406,32.8261],
                   [-86.4411,32.8355],[-86.4335,32.8529],[-86.4365,32.8606],[-86.443,32.8662],
                   [-86.4743,32.8821],[-86.4943,32.9136]],
                  [[-86.9371,34.585],[-86.8985,34.5747],[-86.917,34.5876],[-86.9219,34.6026],
                   [-86.9273,34.6082],[-86.97,34.6382],[-86.9914,34.6809],[-87.0073,34.6915],
                   [-87.0283,34.698],[-87.071,34.7051],[-87.1159,34.723],[-87.193,34.7736],
                   [-87.235,34.7807],[-87.2676,34.7742],[-87.2791,34.7733],[-87.2878,34.7766],
                   [-87.3013,34.7913],[-87.3124,34.7993],[-87.3243,34.8281],[-87.4438,34.8281],
                   [-87.4604,34.8319],[-87.4997,34.8478],[-87.5468,34.8484],[-87.5733,34.8416],
                   [-87.5976,34.8307],[-87.6368,34.8066],[-87.6862,34.7919],[-87.7005,34.7733],
                   [-87.6684,34.7754],[-87.602,34.7895],[-87.5707,34.8007],[-87.5401,34.8166],
                   [-87.5249,34.8196],[-87.4855,34.8101],[-87.4473,34.7966],[-87.4329,34.7872],
                   [-87.4094,34.796],[-87.388,34.7981],[-87.3671,34.7928],[-87.3448,34.7807],
                   [-87.2913,34.7448],[-87.2791,34.7398],[-87.2367,34.7477],[-87.2111,34.746],
                   [-87.1924,34.7419],[-87.1455,34.7118],[-87.1496,34.6956],[-87.1318,34.6877],
                   [-87.109,34.6824],[-87.0897,34.6647],[-87.0716,34.6547],[-87.052,34.6468],
                   [-87.0023,34.6326],[-86.9371,34.585]]
                ],
                [
                  [[-88.1371,30.2492],[-88.1666,30.2493],[-88.2085,30.2448],[-88.2806,30.2303],
                   [-88.3048,30.228],[-88.3133,30.23],[-88.31,30.2332],[-88.2997,30.2318],
                   [-88.2808,30.2338],[-88.2246,30.2456],[-88.1411,30.255],[-88.1306,30.2621],
                   [-88.1247,30.2735],[-88.1247,30.2836],[-88.0868,30.2599],[-88.0749,30.2491],
                   [-88.0788,30.245],[-88.1094,30.2421],[-88.1371,30.2492]]
                ]
              ] }
            },
            {
              type: 'Feature',
              properties: { name: 'Sur de Florida', fill: '#f0902d', edge: '#d9741a' },
              geometry: { type: 'MultiPolygon', coordinates: [
                [
                  [[-81.3527,25.822],[-81.3623,25.8244],[-81.3861,25.8399],[-81.3945,25.8518],
                   [-81.4175,25.865],[-81.4243,25.8677],[-81.4414,25.8638],[-81.4585,25.8689],
                   [-81.4716,25.8817],[-81.474,25.8884],[-81.4875,25.8884],[-81.501,25.884],
                   [-81.509,25.884],[-81.513,25.8864],[-81.5118,25.8968],[-81.5157,25.8999],
                   [-81.5277,25.9015],[-81.5412,25.9003],[-81.5845,25.8888],[-81.6235,25.8972],
                   [-81.6446,25.898],[-81.6545,25.8936],[-81.6638,25.8856],[-81.6783,25.8453],
                   [-81.6848,25.8472],[-81.7132,25.8976],[-81.7271,25.9072],[-81.7319,25.9315],
                   [-81.7456,25.9496],[-81.7497,25.9605],[-81.7478,25.9943],[-81.7624,26.0061],
                   [-81.8017,26.0882],[-81.8088,26.1522],[-81.8146,26.1732],[-81.8207,26.2367],
                   [-81.8331,26.2945],[-81.8446,26.3277],[-81.869,26.3786],[-81.9019,26.4109],
                   [-81.9027,26.4162],[-81.9117,26.4272],[-81.9236,26.4367],[-81.9642,26.458],
                   [-81.9695,26.4765],[-81.997,26.4849],[-82.009,26.4841],[-82.0137,26.4908],
                   [-82.0091,26.5052],[-82.0246,26.5127],[-82.0436,26.5196],[-82.0671,26.5133],
                   [-82.0717,26.4926],[-82.0947,26.4839],[-82.1057,26.4839],[-82.112,26.5408],
                   [-82.1379,26.6374],[-82.1499,26.6541],[-82.1816,26.6817],[-82.1798,26.6967],
                   [-82.1735,26.7018],[-82.1517,26.7041],[-82.139,26.703],[-82.1258,26.6995],
                   [-82.1062,26.6673],[-82.0999,26.6627],[-82.093,26.6656],[-82.0867,26.6852],
                   [-82.085,26.7024],[-82.0666,26.7427],[-82.0614,26.7743],[-82.0614,26.7892],
                   [-82.0551,26.8025],[-82.058,26.822],[-82.0568,26.8588],[-82.0591,26.8766],
                   [-82.0666,26.8824],[-82.0907,26.8887],[-82.093,26.9065],[-82.0901,26.9232],
                   [-82.0832,26.9278],[-82.0677,26.9278],[-82.062,26.9312],[-82.0631,26.9502],
                   [-82.0763,26.9583],[-82.108,26.9577],[-82.1172,26.9542],[-82.1373,26.9261],
                   [-82.162,26.9255],[-82.1695,26.9232],[-82.1752,26.9169],[-82.1729,26.8973],
                   [-82.1563,26.8519],[-82.1471,26.7898],[-82.1511,26.7835],[-82.1729,26.7789],
                   [-82.1787,26.7726],[-82.2218,26.772],[-82.2333,26.7841],[-82.2419,26.7743],
                   [-82.2511,26.7559],[-82.2599,26.7174],[-82.2638,26.7256],[-82.2647,26.7568],
                   [-82.2695,26.7847],[-82.2891,26.8278],[-82.3017,26.8416],[-82.3516,26.9084],
                   [-82.3757,26.946],[-82.2555,26.9453],[-82.2552,27.033],[-81.2672,27.0325],
                   [-81.2677,27.1211],[-81.1683,27.1217],[-81.1691,27.2096],[-80.9432,27.2106],
                   [-80.8712,27.155],[-80.8719,27.1449],[-80.9201,27.0952],[-80.9272,27.0743],
                   [-80.9603,27.0657],[-80.964,27.0622],[-80.9579,27.0507],[-80.9765,27.0436],
                   [-81.033,27.003],[-81.086,26.9792],[-81.102,26.9756],[-81.0991,26.9544],
                   [-81.0947,26.9503],[-81.0877,26.955],[-81.0779,26.9456],[-81.0741,26.9221],
                   [-81.0673,26.9135],[-81.0692,26.897],[-81.0568,26.8859],[-81.0377,26.8761],
                   [-81.02,26.872],[-80.9884,26.8817],[-80.9787,26.8791],[-80.9853,26.8585],
                   [-80.9656,26.8476],[-80.951,26.822],[-80.941,26.7955],[-80.931,26.7784],
                   [-80.896,26.749],[-80.8481,26.7287],[-80.8244,26.7089],[-80.8141,26.7034],
                   [-80.7813,26.6992],[-80.7563,26.6898],[-80.7417,26.6878],[-80.7252,26.6989],
                   [-80.7283,26.7248],[-80.7357,26.7525],[-80.732,26.7696],[-80.7229,26.7475],
                   [-80.7183,26.7428],[-80.7107,26.7407],[-80.6942,26.749],[-80.6918,26.8008],
                   [-80.6874,26.814],[-80.659,26.8399],[-80.636,26.8661],[-80.6204,26.8973],
                   [-80.6147,26.938],[-80.6185,26.9777],[-80.6284,27.0116],[-80.6569,27.0781],
                   [-80.6833,27.1171],[-80.6774,27.1216],[-80.6779,27.206],[-80.2855,27.206],
                   [-80.2848,27.2637],[-80.1993,27.263],[-80.1615,27.1928],[-80.1534,27.1693],
                   [-80.1596,27.1633],[-80.1498,27.1436],[-80.1386,27.1115],[-80.1168,27.0724],
                   [-80.0939,27.0186],[-80.0463,26.8592],[-80.0314,26.7963],[-80.0321,26.7715],
                   [-80.0364,26.7712],[-80.0375,26.7663],[-80.0329,26.7152],[-80.0358,26.676],
                   [-80.0354,26.6123],[-80.0389,26.5693],[-80.0606,26.4447],[-80.0706,26.3365],
                   [-80.0753,26.3187],[-80.0799,26.2644],[-80.0894,26.2319],[-80.1014,26.1478],
                   [-80.1053,26.0963],[-80.1096,26.0872],[-80.1178,25.9864],[-80.1179,25.9158],
                   [-80.1209,25.8832],[-80.1197,25.841],[-80.1274,25.7912],[-80.128,25.7722],
                   [-80.1375,25.7503],[-80.144,25.7408],[-80.1529,25.7029],[-80.1541,25.6833],
                   [-80.1523,25.6768],[-80.155,25.6655],[-80.1609,25.6649],[-80.1769,25.6851],
                   [-80.1704,25.7106],[-80.1645,25.7218],[-80.1662,25.729],[-80.1728,25.7378],
                   [-80.1846,25.7456],[-80.1977,25.7444],[-80.2291,25.7325],[-80.2404,25.7242],
                   [-80.2445,25.7171],[-80.2505,25.688],[-80.2659,25.6584],[-80.2671,25.6518],
                   [-80.2771,25.637],[-80.2884,25.6305],[-80.2967,25.6222],[-80.3015,25.6133],
                   [-80.3056,25.5931],[-80.3056,25.5753],[-80.3021,25.5676],[-80.3139,25.5392],
                   [-80.3287,25.5326],[-80.3394,25.4994],[-80.337,25.4656],[-80.3282,25.4431],
                   [-80.3204,25.4372],[-80.3264,25.4229],[-80.3258,25.398],[-80.3204,25.3915],
                   [-80.3104,25.3897],[-80.3068,25.3844],[-80.3104,25.3731],[-80.3353,25.3387],
                   [-80.3617,25.3274],[-80.3741,25.3174],[-80.383,25.3013],[-80.386,25.2883],
                   [-80.4192,25.2634],[-80.4471,25.248],[-80.4678,25.2325],[-80.4832,25.2165],
                   [-80.488,25.2069],[-80.4953,25.1995],[-80.5081,25.2067],[-80.5129,25.2167],
                   [-80.5204,25.2208],[-80.5302,25.2162],[-80.5409,25.2182],[-80.5408,25.2297],
                   [-80.5485,25.2365],[-80.5708,25.2394],[-80.5892,25.2238],[-80.5848,25.2007],
                   [-80.6096,25.1819],[-80.619,25.1773],[-80.6403,25.1766],[-80.6458,25.174],
                   [-80.6493,25.1687],[-80.6884,25.1647],[-80.695,25.1576],[-80.7037,25.1391],
                   [-80.7151,25.1409],[-80.7219,25.1451],[-80.7429,25.1426],[-80.7464,25.1486],
                   [-80.7463,25.1553],[-80.7519,25.1638],[-80.7576,25.1667],[-80.7962,25.1725],
                   [-80.8265,25.1605],[-80.83,25.1681],[-80.8382,25.1748],[-80.8464,25.1771],
                   [-80.8582,25.1766],[-80.8755,25.1743],[-80.9001,25.162],[-80.9006,25.1397],
                   [-80.9159,25.1413],[-80.9432,25.1344],[-80.9574,25.1357],[-80.9718,25.134],
                   [-80.9992,25.1242],[-81.023,25.1294],[-81.0505,25.1283],[-81.0799,25.1188],
                   [-81.0945,25.1271],[-81.1206,25.1523],[-81.1336,25.1563],[-81.141,25.1639],
                   [-81.1423,25.183],[-81.1467,25.1931],[-81.1555,25.2081],[-81.172,25.2223],
                   [-81.1709,25.2459],[-81.1621,25.2898],[-81.1593,25.2986],[-81.1523,25.3055],
                   [-81.1489,25.3181],[-81.1519,25.3248],[-81.1481,25.3328],[-81.1401,25.3411],
                   [-81.1339,25.343],[-81.1214,25.3388],[-81.1173,25.355],[-81.1285,25.3805],
                   [-81.1414,25.3814],[-81.1505,25.3873],[-81.1507,25.3992],[-81.1468,25.4076],
                   [-81.1687,25.4638],[-81.1919,25.4847],[-81.2082,25.5049],[-81.2101,25.5169],
                   [-81.2032,25.5342],[-81.2044,25.5389],[-81.2093,25.5486],[-81.2256,25.5585],
                   [-81.2327,25.5734],[-81.2331,25.5866],[-81.2405,25.599],[-81.2407,25.6136],
                   [-81.254,25.6382],[-81.2774,25.665],[-81.2903,25.6875],[-81.3289,25.7172],
                   [-81.335,25.7156],[-81.3461,25.7215],[-81.344,25.7477],[-81.3468,25.754],
                   [-81.3595,25.7664],[-81.3619,25.7727],[-81.3404,25.7866],[-81.3492,25.8168],
                   [-81.3527,25.822]]
                ],
                [
                  [[-81.5353,24.6795],[-81.519,24.6878],[-81.5164,24.7003],[-81.5124,24.7037],
                   [-81.491,24.7101],[-81.4766,24.7112],[-81.4742,24.7063],[-81.4693,24.7043],
                   [-81.4541,24.7108],[-81.4519,24.7145],[-81.4527,24.7362],[-81.4566,24.7401],
                   [-81.4513,24.7475],[-81.4408,24.7354],[-81.4386,24.727],[-81.432,24.7229],
                   [-81.423,24.7319],[-81.4216,24.7376],[-81.4271,24.7458],[-81.4306,24.7473],
                   [-81.431,24.7518],[-81.4255,24.753],[-81.4028,24.7491],[-81.3929,24.7434],
                   [-81.3895,24.7313],[-81.3856,24.7262],[-81.3604,24.7088],[-81.3193,24.7012],
                   [-81.3148,24.6918],[-81.3097,24.665],[-81.298,24.6568],[-81.3031,24.6517],
                   [-81.3328,24.6395],[-81.3951,24.6211],[-81.4019,24.6236],[-81.4033,24.6403],
                   [-81.4142,24.6472],[-81.4323,24.6459],[-81.4486,24.6402],[-81.4704,24.642],
                   [-81.481,24.6451],[-81.4818,24.6474],[-81.4764,24.6532],[-81.4805,24.6598],
                   [-81.4986,24.665],[-81.5056,24.6546],[-81.5112,24.6251],[-81.5186,24.6203],
                   [-81.5464,24.6149],[-81.603,24.5864],[-81.6642,24.5731],[-81.6853,24.5587],
                   [-81.7325,24.5564],[-81.766,24.5521],[-81.7862,24.5466],[-81.8103,24.5447],
                   [-81.8129,24.5465],[-81.8144,24.5636],[-81.8114,24.5697],[-81.8007,24.571],
                   [-81.7941,24.586],[-81.7738,24.585],[-81.7392,24.59],[-81.7305,24.582],
                   [-81.7159,24.588],[-81.7155,24.5925],[-81.7054,24.5976],[-81.6993,24.5976],
                   [-81.6942,24.5919],[-81.687,24.5925],[-81.6557,24.6163],[-81.6371,24.6214],
                   [-81.6148,24.6428],[-81.6145,24.6506],[-81.5829,24.6587],[-81.5805,24.6691],
                   [-81.5629,24.6929],[-81.5576,24.6925],[-81.5421,24.681],[-81.5353,24.6795]]
                ],
                [
                  [[-80.3076,25.2576],[-80.354,25.1843],[-80.3499,25.1688],[-80.3771,25.1305],
                   [-80.3998,25.1085],[-80.4283,25.0955],[-80.431,25.0892],[-80.4434,25.0761],
                   [-80.462,25.0699],[-80.4739,25.0603],[-80.4939,25.0385],[-80.4891,25.0313],
                   [-80.4948,25.023],[-80.538,24.9902],[-80.5658,24.9582],[-80.5717,24.9537],
                   [-80.5961,24.9482],[-80.6117,24.9384],[-80.6356,24.913],[-80.6594,24.8974],
                   [-80.6613,24.8997],[-80.6602,24.905],[-80.6413,24.9143],[-80.6239,24.9312],
                   [-80.6242,24.9391],[-80.6217,24.9443],[-80.5971,24.9585],[-80.5811,24.9647],
                   [-80.5708,24.9622],[-80.5588,24.9715],[-80.5441,24.9999],[-80.5433,25.0073],
                   [-80.546,25.0148],[-80.5245,25.0169],[-80.5091,25.0283],[-80.4956,25.0475],
                   [-80.4812,25.0566],[-80.4607,25.0789],[-80.4655,25.0866],[-80.4818,25.0919],
                   [-80.4947,25.1023],[-80.4842,25.1094],[-80.4775,25.1074],[-80.4762,25.0995],
                   [-80.4504,25.0888],[-80.4336,25.1063],[-80.4335,25.1147],[-80.4477,25.1477],
                   [-80.4465,25.1513],[-80.4133,25.1371],[-80.4032,25.1418],[-80.3955,25.1507],
                   [-80.3872,25.1709],[-80.3919,25.1922],[-80.3872,25.1981],[-80.37,25.2064],
                   [-80.3587,25.207],[-80.3498,25.2106],[-80.3373,25.2314],[-80.3338,25.2539],
                   [-80.3362,25.2616],[-80.3427,25.2681],[-80.3682,25.2824],[-80.364,25.2865],
                   [-80.3394,25.2901],[-80.3347,25.2859],[-80.3287,25.2865],[-80.3157,25.2942],
                   [-80.2926,25.3144],[-80.2896,25.3251],[-80.276,25.344],[-80.257,25.3612],
                   [-80.2546,25.3808],[-80.2463,25.3986],[-80.2261,25.4063],[-80.2143,25.417],
                   [-80.1923,25.4733],[-80.19,25.4858],[-80.1917,25.4953],[-80.1888,25.5077],
                   [-80.1793,25.519],[-80.1745,25.5184],[-80.174,25.4828],[-80.184,25.4686],
                   [-80.2042,25.4122],[-80.222,25.3974],[-80.238,25.3618],[-80.2404,25.347],
                   [-80.2499,25.3429],[-80.2601,25.3246],[-80.2681,25.3207],[-80.2882,25.2828],
                   [-80.3076,25.2576]]
                ],
                [
                  [[-82.2465,26.6834],[-82.2183,26.6264],[-82.2143,26.6029],[-82.1965,26.5598],
                   [-82.1775,26.5023],[-82.166,26.4897],[-82.1494,26.4776],[-82.1315,26.477],
                   [-82.12,26.4736],[-82.0884,26.4552],[-82.0769,26.4661],[-82.0626,26.4701],
                   [-82.0384,26.4569],[-82.0156,26.4549],[-82.0139,26.4521],[-82.0631,26.4255],
                   [-82.0829,26.4221],[-82.0981,26.425],[-82.1267,26.4363],[-82.1487,26.4555],
                   [-82.177,26.4716],[-82.1864,26.4892],[-82.2014,26.5563],[-82.2055,26.5665],
                   [-82.2221,26.5904],[-82.2389,26.6364],[-82.268,26.6828],[-82.2644,26.6985],
                   [-82.2558,26.7034],[-82.2552,26.7082],[-82.2465,26.7064],[-82.2425,26.6944],
                   [-82.2465,26.6834]]
                ],
                [
                  [[-81.0238,24.7169],[-81.0343,24.7273],[-81.071,24.7117],[-81.0759,24.7043],
                   [-81.0784,24.6924],[-81.108,24.6886],[-81.1254,24.7083],[-81.1074,24.7128],
                   [-81.0991,24.712],[-81.0668,24.7239],[-81.0418,24.743],[-81.0367,24.7428],
                   [-81.0352,24.74],[-81.0222,24.7331],[-81.0169,24.7347],[-80.9944,24.744],
                   [-80.9865,24.7527],[-80.9104,24.7823],[-80.9063,24.7699],[-80.912,24.765],
                   [-80.9385,24.7675],[-81.0238,24.7169]]
                ],
                [
                  [[-82.1011,24.5847],[-82.0994,24.5725],[-82.1044,24.5612],[-82.1168,24.5491],
                   [-82.1594,24.5482],[-82.1652,24.5522],[-82.1644,24.5634],[-82.1507,24.5763],
                   [-82.1431,24.5934],[-82.1354,24.5969],[-82.1253,24.5974],[-82.1042,24.5883],
                   [-82.1011,24.5847]]
                ],
                [
                  [[-81.3185,24.7295],[-81.3268,24.7284],[-81.3502,24.7465],[-81.3574,24.7568],
                   [-81.3427,24.7563],[-81.3276,24.7623],[-81.3246,24.7672],[-81.3177,24.7573],
                   [-81.3055,24.7566],[-81.2908,24.7369],[-81.2883,24.7209],[-81.303,24.7142],
                   [-81.3107,24.7271],[-81.3185,24.7295]]
                ],
                [
                  [[-80.8503,24.8026],[-80.8461,24.8075],[-80.8302,24.8143],[-80.7928,24.8439],
                   [-80.7806,24.8405],[-80.7905,24.8178],[-80.7961,24.8119],[-80.8223,24.8126],
                   [-80.8503,24.8026]]
                ],
                [
                  [[-80.7118,24.8633],[-80.7614,24.8362],[-80.767,24.8362],[-80.7455,24.8507],
                   [-80.7323,24.8648],[-80.72,24.8646],[-80.703,24.8809],[-80.6918,24.8858],
                   [-80.6904,24.8815],[-80.7118,24.8633]]
                ],
                [
                  [[-81.2783,24.6604],[-81.26,24.6748],[-81.2498,24.6734],[-81.2461,24.6758],
                   [-81.2432,24.674],[-81.2448,24.6692],[-81.2818,24.6537],[-81.2783,24.6604]]
                ]
              ] }
            }
          ]
        }
      });

      /* 1. halo difuso de la sombra, desplazado abajo-derecha */
      map.addLayer({
        id: 'coverage-shadow-soft',
        type: 'line',
        source: 'coverage',
        paint: {
          'line-color': SHADOW,
          'line-width': 7,
          'line-blur': 7,
          'line-opacity': 0.16,
          'line-translate': [3, 4],
          'line-translate-anchor': 'viewport'
        }
      });
      /* 2. nucleo de esa misma sombra: levanta la zona del mapa */
      map.addLayer({
        id: 'coverage-shadow',
        type: 'fill',
        source: 'coverage',
        paint: {
          'fill-color': SHADOW,
          'fill-opacity': 0.13,
          'fill-translate': [3, 4],
          'fill-translate-anchor': 'viewport'
        }
      });
      /* 3. relleno translucido: deja ver el mapa por debajo */
      map.addLayer({
        id: 'coverage-fill',
        type: 'fill',
        source: 'coverage',
        paint: {
          'fill-color': ['get', 'fill'],
          'fill-opacity': 0.45
        }
      });
      /* 4. borde */
      map.addLayer({
        id: 'coverage-line',
        type: 'line',
        source: 'coverage',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'edge'],
          'line-width': 2.6,
          'line-opacity': 1
        }
      });

      /* encuadrar siempre las dos zonas, sea cual sea el tamano del marco */
      var covBounds = [[-88.60, 24.40], [-79.90, 35.10]];
      var fitCoverage = function () {
        map.fitBounds(covBounds, { padding: 16, duration: 0 });
      };
      fitCoverage();
      window.addEventListener('resize', fitCoverage);
    });
  }

})();

/* ============================================================
   Scroll estilo Zoox (2026-08): dos piezas replicadas de zoox.com
   1) Scroll suave con inercia tipo Lenis (solo rueda/trackpad en
      dispositivos de puntero fino; en tactil el scroll nativo ya
      tiene esa inercia, igual que hace Lenis).
   2) Las fotos de "Experiencia de Lujo" se abren con un recorte
      redondeado ligado a la posicion del scroll (clip-path con
      scrub reversible), como los bloques de imagen de zoox.com.
   ============================================================ */
(function () {
  'use strict';
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- 1) inercia de rueda (Lenis casero) ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var target = window.scrollY || 0;
    var current = target;
    var rafId = null;
    var maxScroll = function () {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    };
    var step = function () {
      current += (target - current) * 0.3;   /* suavizado ligero: casi nativo, solo un toque sedoso */
      if (Math.abs(target - current) < 0.5) {
        current = target;
        rafId = null;
      } else {
        rafId = requestAnimationFrame(step);
      }
      window.scrollTo(0, current);
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;   /* zoom o widgets propios */
      var t = e.target;
      if (t && t.closest && t.closest('.h-ride__sugg, .h-city__list, textarea, select')) return;
      var d = e.deltaY;
      if (e.deltaMode === 1) { d *= 33; } else if (e.deltaMode === 2) { d *= window.innerHeight; }
      e.preventDefault();
      target = Math.max(0, Math.min(maxScroll(), target + d));
      if (rafId === null) rafId = requestAnimationFrame(step);
    }, { passive: false });
    /* teclado, barra lateral o anclas: resincronizar la meta */
    window.addEventListener('scroll', function () {
      if (rafId === null) { target = current = window.scrollY; }
    }, { passive: true });
  }

  /* ---------- 2) apertura de las fotos de servicios ---------- */
  var medias = Array.prototype.slice.call(document.querySelectorAll('.sv-media'));
  if (!medias.length) return;
  var CLIP = 14;     /* % de recorte inicial por lado */
  var RAD_MAX = 58;  /* radio con la foto cerrada */
  var RAD_MIN = 40;  /* radio final (= border-radius base de .sv-img) */
  var pend = false;
  var update = function () {
    pend = false;
    var vh = window.innerHeight || 1;
    for (var i = 0; i < medias.length; i++) {
      var el = medias[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      /* progreso 0→1 mientras el bloque recorre el viewport (top→bottom / bottom→top),
         el mismo rango que usa zoox en sus ScrollTrigger */
      var p = (vh - r.top) / (vh + r.height);
      p = Math.max(0, Math.min(1, p));
      var v = Math.min(1, p / 0.72);          /* abierta del todo a ~3/4 del recorrido */
      var inset = (CLIP * (1 - v)).toFixed(2);
      var rad = (RAD_MIN + (RAD_MAX - RAD_MIN) * (1 - v)).toFixed(1);
      var val = 'inset(' + inset + '% ' + inset + '% round ' + rad + 'px)';
      el.style.webkitClipPath = val;
      el.style.clipPath = val;
    }
  };
  var onScroll = function () {
    if (!pend) { pend = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
