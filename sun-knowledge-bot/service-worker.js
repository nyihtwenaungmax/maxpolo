const CACHE_NAME = 'sun-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache API calls — always go to network for live answers
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // App shell: cache-first, falling back to network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
