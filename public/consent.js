/* Google Analytics 4 with a consent banner only where opt-in is required.
   The choice is kept in localStorage ("lipu-consent": "yes" | "no"). Until GA loads,
   window.gtag is a no-op, so event calls elsewhere in the app are always safe.

   With no stored choice, geo.lipu.dev (Cloudflare Worker, komapc/lipu-hub geo/) says
   whether the visitor's region needs opt-in (EU/EEA, UK, CH, unknown). Only a literal
   {"consentRequired": false} within 1.5 s loads GA straight away, with a one-time
   notice and an Opt out button; the implied grant is not stored, so it is re-checked
   each visit. Anything else (error, timeout, other value) shows the Allow/Decline
   banner and loads nothing until Allow.

   window.lipuConsent.open() re-opens the banner (About page, "Analytics settings"). */
(function () {
  var GA = document.currentScript && document.currentScript.dataset.ga;
  var KEY = 'lipu-consent';
  var NOTICE_KEY = 'lipu-consent-notice';
  var GEO_URL = 'https://geo.lipu.dev/';
  var GEO_TIMEOUT_MS = 1500;
  var get = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var set = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };

  function load() {
    if (!GA) return;
    window['ga-disable-' + GA] = false;
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA, { anonymize_ip: true });
  }

  // Stops further hits from an already-loaded GA and deletes its cookies.
  function unload() {
    if (GA) window['ga-disable-' + GA] = true;
    var host = location.hostname;
    var domains = ['', '; domain=' + host, '; domain=.' + host, '; domain=.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function consentNotRequired() {
    return new Promise(function (resolve) {
      try {
        var ctrl = new AbortController();
        setTimeout(function () { ctrl.abort(); resolve(false); }, GEO_TIMEOUT_MS);
        fetch(GEO_URL, { signal: ctrl.signal, credentials: 'omit', cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) { resolve(!!d && d.consentRequired === false); })
          .catch(function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
  }

  var T = {
    en: {
      ask: 'We use Google Analytics (cookies) to count visits and searched words.', allow: 'Allow', decline: 'Decline',
      notice: 'We use Google Analytics (cookies) to count visits and searched words. You can opt out at any time.', ok: 'OK', optOut: 'Opt out'
    },
    eo: {
      ask: 'Ni uzas Google Analytics (kuketojn) por kalkuli vizitojn kaj serĉitajn vortojn.', allow: 'Permesi', decline: 'Rifuzi',
      notice: 'Ni uzas Google Analytics (kuketojn) por kalkuli vizitojn kaj serĉitajn vortojn. Vi povas malaliĝi iam ajn.', ok: 'Bone', optOut: 'Malaliĝi'
    },
    io: {
      ask: 'Ni uzas Google Analytics (kuketi) por kontar viziti e serchita vorti.', allow: 'Permisar', decline: 'Refuzar',
      notice: 'Ni uzas Google Analytics (kuketi) por kontar viziti e serchita vorti. Vu povas refuzar ulatempe.', ok: 'Bone', optOut: 'Refuzar'
    }
  };

  var current = null;

  // mode "ask": Allow / Decline. mode "notice": GA already running; OK / Opt out.
  function show(mode) {
    if (current) current();
    var l = (document.documentElement.lang || 'en').slice(0, 2);
    var t = T[l] || T.en;
    var notice = mode === 'notice';
    var st = document.createElement('style');
    st.textContent = '#lipu-consent{position:fixed;left:12px;right:12px;bottom:12px;max-width:560px;margin:0 auto;padding:12px 14px;' +
      'background:#fff;color:#1f1b16;border:1px solid #cfc6b6;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);' +
      'font:14px/1.4 system-ui,sans-serif;z-index:2147483000;display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
      '#lipu-consent span{flex:1 1 220px}#lipu-consent button{font:inherit;padding:6px 12px;border-radius:8px;cursor:pointer;' +
      'border:1px solid #4f46e5;background:none;color:inherit}#lipu-consent button.y{background:#4f46e5;color:#fff}' +
      '@media(max-width:480px){#lipu-consent span{flex-basis:100%}}' +
      '@media(prefers-color-scheme:dark){#lipu-consent{background:#1e1b16;color:#f1ebe0;border-color:#5a5144}#lipu-consent button{border-color:#818cf8}#lipu-consent button.y{background:#4f46e5}}';
    var d = document.createElement('div');
    d.id = 'lipu-consent';
    d.setAttribute('role', notice ? 'status' : 'dialog');
    d.setAttribute('aria-label', 'Cookie consent');
    var sp = document.createElement('span'); sp.textContent = notice ? t.notice : t.ask;
    var y = document.createElement('button'); y.className = 'y'; y.textContent = notice ? t.ok : t.allow;
    var n = document.createElement('button'); n.textContent = notice ? t.optOut : t.decline;
    var close = function () { d.remove(); st.remove(); current = null; };
    current = close;
    y.onclick = function () {
      if (notice) set(NOTICE_KEY, '1');
      else { set(KEY, 'yes'); load(); }
      close();
    };
    n.onclick = function () { set(KEY, 'no'); unload(); close(); };
    d.append(sp, y, n);
    document.head.appendChild(st);
    document.body.appendChild(d);
  }

  function whenBody(fn) {
    if (document.body) fn(); else document.addEventListener('DOMContentLoaded', fn);
  }

  window.lipuConsent = { open: function () { whenBody(function () { show('ask'); }); } };

  var c = get(KEY);
  if (c === 'yes') load();
  else if (c !== 'no') {
    consentNotRequired().then(function (notRequired) {
      var now = get(KEY);
      if (now === 'yes' || now === 'no') return;
      if (notRequired) {
        load();
        if (!get(NOTICE_KEY)) whenBody(function () { show('notice'); });
      } else {
        whenBody(function () { show('ask'); });
      }
    });
  }
})();
