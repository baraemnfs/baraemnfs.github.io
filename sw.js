// Service worker for «البراعم». VERSION is replaced at build time, so every new build replaces the cached app.
const VERSION = '0bda48ad87';
const CACHE = 'albaraem-' + VERSION;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', function (e) {
  // cache:'reload' = straight from the server, never the browser's own HTTP cache (a new version must not store the old page)
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
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
  if (req.mode === 'navigate') {
    // The app page: the saved copy opens at once (no waiting for the network). A new version arrives with a new sw.js:
    // it is stored on install, and the open page reloads itself when it is safe (see the page's controllerchange handler).
    const net = function () {
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }); }
        return res;
      });
    };
    e.respondWith(caches.match('./index.html').then(function (hit) { return hit || net(); }).catch(function () { return net(); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
