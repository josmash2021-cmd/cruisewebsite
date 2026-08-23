# AGENTS.md — Cerebro de navegación Kimi · cruisewebsite (CruiseInRide)

> **Propósito:** trabajar con el mapa ya conocido, SIN gastar tokens explorando.
> Este archivo se carga solo en cada sesión — denso a propósito.
> **Regla de oro:** si el flujo está mapeado abajo, ve DIRECTO a las líneas/funciones listadas. No leas el archivo entero (book.html = 12,376 líneas / ~880 KB).

---

## ⚡ Workflow token-eficiente

1. Lee la tarea → ubica el flujo en el mapa → `Read` con `line_offset` SOLO la región (los números se mueven con cada commit; verifica antes de editar).
2. **TODA página existe DOS VECES: raíz (ES) y `/en/` (EN), archivos espejo.** Todo cambio en `book.html` se aplica también en `en/book.html` (y viceversa). Olvidar una copia = idiomas desincronizados. El diff estructural es casi nulo (solo `lang`, meta description, hrefs `../en/` vs `./`).
3. Verificación tras editar JS inline: extraer el `<script>` y pasarlo por `node --check` / `new Function(body)` (los scripts no son módulos).
4. Deploy: **GitHub Pages desde la rama `gh-pages` — push = deploy en vivo a cruiseinride.com**. No hay build, no hay CI, no hay preview. Cuidado: cada push sale a producción al instante.
5. Assets en `assets/` llevan query `?v=YYYYMMDDletra` — bump manual al editarlos o el browser sirve el cache viejo.
6. Git: rama `gh-pages`, remoto `github.com/josmash2021-cmd/cruisewebsite.git`. Mensajes en español, conventional (`fix(book): ...`). `git status` antes de commitear (WIP ajeno).

---

## 🧠 Mapa del repo

- `index.html` (415 l) + `assets/home.js` (1,734 l) — landing, cotizador con Mapbox, prefill `?pickup=&dropoff=` → /book. WhatsApp FAB.
- `book.html` (12,376 l) — **EL archivo central**: widget completo (mapa, cotización, pago Stripe, tracking vivo, chat, rating, propinas, schedule).
- `auth.html` (2,058 l) — login/registro contra Railway directo: `/auth/web/social|check-exists|send-otp|verify-otp|login|complete-login|register|photo|me|trips|profile`. Guarda `vr_at` (token) y `vr_au` (user) en localStorage.
- `account.html` + `assets/account.js` — cuenta; **escudo anti-copia/zoom/DevTools (pedido del dueño 2026-08-14 — no quitar)**.
- `profile.html`, `wallet.html` (Cruise Cash), `contact.html` (FAQ + WhatsApp), `store.html` + `assets/store.*` (solo drivers, gate `assets/nav-role.js` → `/auth/web/me`), `delete-account.html`, `privacy.html`, `terms.html`, `404.html`.
- **Basura histórica (no tocar ni referenciar):** `classic.html.bak`, `fragments/`, `theme_export__…/`.

## 🗺️ Mapa de `book.html` por rangos (revisión 2026-08-23)

- **L5-21** — redirect idioma (respeta `cir_lang`) + limpieza de URL `/book.html`→`/book`.
- **L72-131** — boot anti-parpadeo (`vr_book_state` paso 3 / `vr_active_booking` → sheet oculto; sin `?pickup=` BORRA el estado guardado) + bfcache reload en `pageshow persisted`. Config: `__VIP_SVC_STATES__=['AL','FL']` (bloqueo "Not available here").
- **L206-5544** — HTML + CSS inline (la mayoría del archivo). Payment overlay ~L455-500 (filas `data-vipride-pay-option="card|apple_pay|google_pay|test_mode"`). Prefijos CSS: `vipRide__*`, `vrd-*` (desktop), `ch-*` (header). Scripts externos: Stripe v3 (~L5546), Mapbox GL 3.3.0, EmailJS 4, Google GSI + Apple JSAPI (~L9790), `vip-ride-auth` CDN Shopify (~L9792 → `__vipAuthCheck/__vipAuthToken/__vipShowGate`).
- **L1114-1245** — **i18n core**: dicts `T.en`/`T.es`, `__vrLang`, `__vrT(k,rep)`, patch ES de textos estáticos, templates bilingües (`__vrReserveHtml`, `__vrMpFooterHtml`...).
- **L1246-1485** — `__vrGuestCollect(cb)` — sheet de invitado (nombre/email/tel, `vr_guest_info`), gate antes de pagar sin sesión.
- **L2620-3564** — `__VR_AIRPORTS` (40 aeropuertos US con terminales/doors/surcharge) + airport sheet `__vrAptOpen()`.
- **L3566-4758** — **tarjeta de viaje activo** `__vrTripShow(driverData, bookingId, apiBase, webKey, pu, dr)`: poll `GET /bookings/web/{id}/status`, chat, cambiar destino/paradas, propina `POST .../tip`, rating `POST .../rate`, `rider-confirmed`, cancel, ETA pill.
- **L4881-5544** — Scheduled Card (desktop + móvil): `__vrSchedShow`, bootstrap desde `vr_active_booking` (ids `TEMP-` incluidos).
- **L6341-9781** — **SCRIPT PRINCIPAL** (~3,440 l):
  - L6348-6510 — early-resume: adopta viaje vivo de `vr_active_booking`; `_vrAdoptServerTrip` → `GET /auth/web/active-trip` **directo a Railway** (no por el proxy).
  - L6523-6560 — `_vrLS`, `_vrSheetHide/Show`, `_vrTrack`, `_vrToast`, draft cart TTL 24 h.
  - L6563-6630 — constantes: MAPBOX_TOKEN, default Birmingham AL, refs `data-vipride-*`.
  - L6708-7230 — `goToStep`, pins dorados (`showMarkerLabels`/`_lblFix` — labels nunca cortados, pineado por commits recientes), `attachAutocomplete` propio, `drawRoute` (rAF), **`fitRouteBounds` (~L7144) + `vrFreezeLeft` (~L11246) = ZONA MÁS FRÁGIL** (4+ commits seguidos de "la ruta se sale al colapsar el panel" — tratar con pinzas).
  - **L7479-7670 — motor de precios**: `_VR_PRICING` (STANDARD/COMPACT/PREMIUM/BLACK, calibrado vs Uber 2026-08-11, `discountCents:500`, `floorCents:800`), invitado ve ÷0.7 ("30% OFF miembro", solo presentación — el server firma el real), `_vrSurchargeCents`, **`_vrFetchQuote` → `POST /bookings/web/quote`** con fallback silencioso a tabla local, `_vrFetchNearby`.
  - L7738 — `doCheckout` = **código muerto** (legacy Shopify cart, `return` inmediato); el submit viejo del form (EmailJS + WhatsApp) también muerto pero sigue cableado.
  - L7816-8340 — `initMapbox`. L8341-8900 — UI móvil: loc picker, calendario schedule (`__vrScheduleActive`), map picker.
  - **L8901-8923 — test mode**: `_vrTestAllowed()` = solo `vr_au.email === 'josmash31@gmail.com'` (hardcodeado a propósito — salta el cobro y despacha chofer REAL; nunca exponer a público). `_vrSyncTestBtn` cada 2 s.
  - L8924-9080 — pay overlay + card form (`_cfMount/_cfSubmit`).
  - **L9080-9213 — pagos**: Stripe `pk_live_51T8W4J…` (~L9106); `_payWithCardElement` y `_payWithNativeSheet` → `POST /payments/web/create-intent` (amount + metadata + `quote_token` + `user_token`) → confirm → `_postBookingToCruise`.
  - L9214-9260 — VIP menu: Supabase `POST /rest/v1/reservations` + EmailJS `template_vip_menu` (fire-and-forget). L9260-9295 — emails de agendado vía proxy `/emails/web/sched-{confirm,driver,enroute}`.
  - **L9295-9342 — `_postBookingToCruise`**: `POST /bookings/web/create` (coords, vehicle_type, amount_cents, payment_method, quote_token, scheduled_at, campos aeropuerto, payment_intent_id, user_token/guest). Error post-pago → `_showBookingAfterPaymentError` con PI para soporte.
  - L9372-9781 — post-pago: `_showReserveOk`, `_showDriverFound`, `_vrSearchPad`, `_pollForDriver`, test mode `_showTestConfirm`, `_vrFullReset`.
- **L11194-12308** — desktop bar (`vrFreezeLeft`, when-panel) + variante móvil del when-picker.

## 🔌 Servicios externos (todo embebido en el HTML público)

| Servicio | Dónde | Uso |
|---|---|---|
| Proxy Cloudflare `https://cruise-api-proxy.cruise-api.workers.dev` | `_EARLY_API`/`_apiBase` | TODO: bookings/quote/create/status/chat/cancel/stops/tip/rate, payments/web/create-intent, emails sched-*, set-default-payment |
| Web key Bearer `5dd56c33…e335ad` | `_EARLY_KEY`/`_webKey` | auth del proxy |
| Railway directo `cruiseapp2-production.up.railway.app` | auth.html, `_vrAdoptServerTrip`, nav-role.js | `/auth/web/*` — **dos backends distintos; si el proxy cambia una regla, divergen** |
| Stripe `pk_live_51T8W4J…` | book ~L9106 | Card Element + paymentRequest |
| Mapbox pk (cuenta royalpurplecorp) | ~L6563 | mapa/geocode/directions |
| EmailJS `service_mhj1mcp` | templates `template_vip_menu`, `template_yo0y14n` (legacy) | emails |
| Supabase `elvszwazwvpgqvnzxwnq` + anon key | ~L9214 | VIP menu reservations |
| Vercel `rides-vip-menu.vercel.app` | ~L9210 | VIP menu link |
| WhatsApp `wa.me/16593052974` | FAB + legacy | contacto |

**Estado:** localStorage `vr_at`/`vr_au`/`vr_active_booking`/`vr_guest_info`/`vr_sid`/`cir_lang`; sessionStorage `vr_book_state` (TTL 6 h, ligado a `location.search`). Globales entre scripts vía `window.__vr*` con patrón "registrar si no existe".

## 🪤 Trampas y bugs conocidos

1. **ES/EN en par, SIEMPRE** — la trampa #1 del repo. Antes de cerrar cualquier tarea: `diff book.html en/book.html` debe mostrar solo lang/meta/hrefs.
2. **Apple Pay / Google Pay (fix 2026-08-23):** las filas se revelan SOLO con `paymentRequest.canMakePayment()` real de Stripe (`result.applePay`/`result.googlePay`) — el UA-sniff viejo (`_isIOS && ApplePaySession`) fue eliminado (escondía Apple Pay en macOS Safari y la mostraba en dominios no registrados). Y `_payReq.show()` va DENTRO del gesto del click, con el fetch del intent en paralelo (Safari cancela la hoja si show() va tras un await de red; el handler `paymentmethod` ya espera el client_secret con polling `_waitAndConfirm`). **Requisito fuera del código:** el dominio `cruiseinride.com` debe estar registrado en Stripe Dashboard → Payment methods → Apple Pay → Web domains (+ archivo `/.well-known/apple-developer-merchantid-domain-association` servido) o `applePay` llega `false` y la fila no sale (por diseño).
3. **Cash NO está disponible online** — `doCheckout` retorna con toast; no "arreglarlo" sin pedido explícito.
3b. **Orden de asignación en el script principal (fix 2026-08-23):** `_vrRestoreState` corre en L7401 (entrada desde la landing con `?pickup=`), ANTES de que se asignen `_actionBtns`/`_dE`/refs (L7707+). Si el estado guardado traía vehículo (`st.v`), `selectCard` seleccionaba la tarjeta pero la barra Payment Method + Request Ride quedaba oculta ("a veces no sale el botón"). Por eso `selectCard` revela la barra con fallback `_actionBtns||root.querySelector('[data-vipride-action-btns]')` — no revertir al `if(_actionBtns)` pelado.
4. **`fitRouteBounds`/`vrFreezeLeft`** es la zona con más regresiones del repo (ruta que se sale/pierde al colapsar el panel) — cualquier cambio ahí exige probar el colapso del panel completo.
5. **Secretos en cliente:** web API key, Supabase anon key, email del dueño como gate de test mode — histórico, no agregar nuevos.
6. **Polls perpetuos** (`_vrSyncTestBtn` 2 s, `_vrMemberTick`) — patrón existente, no replicarlo para cosas nuevas.
7. **Push = producción.** No hay staging. Cambios riesgosos se prueban local abriendo el HTML (el mapa/Stripe sí corren en localhost con las keys live).
8. JS inline mezcla ES5 (`var`+`function`, estilo dominante) con moderno puntual — seguir el estilo del bloque que se toca; comentarios del porqué en español (estilo diario de guerra).

*Última actualización: 2026-08-23 — creado tras el fix de Apple Pay/Google Pay (canMakePayment real + show() en el gesto del click).*
