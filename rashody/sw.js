// Кэш приложения для работы без интернета.
const CACHE = 'rashody-v20';
const FILES = ['./', 'index.html', 'categories.js', 'vendor/jsQR.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Сначала сеть (чтобы обновления появлялись сразу), без сети или если она тормозит больше 3 с — копия из кэша.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(e.request, { ignoreSearch: true });
    // если сервер ответил ошибкой (например, 404), а копия есть — открываем копию
    const net = fetch(e.request, { cache: 'no-cache' })
      .then(r => { if (r.ok) { c.put(e.request, r.clone()); return r; } return cached || r; });
    if (!cached) return net;
    const slow = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([net.catch(() => cached), slow]);
  }));
});
