// Bump CACHE_NAME on every release so the activate handler evicts the
// previous cache and the new index.html (with fresh hashed asset URLs) is
// fetched immediately. Stale HTML pointing at old hashed asset bundles is
// what produced the post-deploy blank-page regression.
const CACHE_NAME = 'nu-birth-fitness-v3-2026-04-26';
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/hero-bg.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Pass through requests to YouTube/Google APIs and any cross-origin host.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests (HTML documents) — network-first so the freshly
  // deployed index.html (with the latest hashed asset URLs) is always served
  // when online. Falls back to the cached offline page only on hard failure.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          return fresh;
        } catch {
          const cached = await caches.match('/offline.html');
          return cached ?? new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // Hashed build assets — cache-first, then add to cache on miss. They are
  // immutable per build because Vite includes a content hash in the filename.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return new Response('Offline', { status: 503 });
        }
      })(),
    );
    return;
  }

  // Other same-origin GETs (icons, manifest, hero image) — cache-first with
  // network fallback.
  event.respondWith(
    caches.match(req).then((cached) => cached ?? fetch(req).catch(() => new Response('', { status: 504 }))),
  );
});
