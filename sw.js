// Service worker for «البراعم». VERSION is replaced at build time, so every new build replaces the cached app.
const VERSION = '5a3b6a58e8';
const CACHE = 'albaraem-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('albaraem-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                       // data calls (POST to Apps Script) always go to the network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // fonts and Google stay with the browser
  if (req.mode === 'navigate') {                          // the app page: newest when online, cached when offline or very slow
    const net = fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }); }
      return res;
    });
    e.respondWith(new Promise(function (resolve) {
      let done = false;
      const fin = function (r) { if (!done && r) { done = true; resolve(r); } };
      const timer = setTimeout(function () { caches.match('./index.html').then(fin); }, 6000);   // weak signal: open the saved copy
      net.then(function (r) { clearTimeout(timer); if (r.ok) fin(r); else caches.match('./index.html').then(function (h) { fin(h || r); }); })
        .catch(function () { clearTimeout(timer); caches.match('./index.html').then(function (h) { fin(h || Response.error()); }); });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
