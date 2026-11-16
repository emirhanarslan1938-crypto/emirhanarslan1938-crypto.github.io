const CACHE = 'ritual-v3';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== CACHE + '-img').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    // app shell: network first so updates arrive, cache as offline fallback
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); return res; })
      .catch(() => caches.match(r).then(x => x || caches.match('./index.html'))));
    return;
  }
  // album covers for offline journal (only plain <img> loads; CORS loads for story images go straight to network)
  if (r.mode === 'no-cors' && r.destination === 'image' && /mzstatic\.com|dzcdn\.net/.test(u.host)) {
    e.respondWith(caches.open(CACHE + '-img').then(c => c.match(r).then(hit => hit || fetch(r).then(res => { c.put(r, res.clone()); return res; }))));
  }
});
