importScripts('/webtorrent-worker.js');

const CACHE_PREFIX = 'totalflix-';
const PAGE_CACHE = 'totalflix-pages-v2';
const OFFLINE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PAGE_CACHE);
    await Promise.allSettled(
      OFFLINE_URLS.map(async (url) => {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok) await cache.put(url, response);
      }),
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const hadLegacyCache = cacheNames.some((name) => name.startsWith(CACHE_PREFIX) && name !== PAGE_CACHE);

    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== PAGE_CACHE)
        .map((name) => caches.delete(name)),
    );

    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }

    await self.clients.claim();

    const windowClients = await self.clients.matchAll({ type: 'window' });
    windowClients.forEach((client) => {
      client.postMessage({ type: 'TOTALFLIX_UPDATE_READY', cache: PAGE_CACHE });
    });

    // A primeira migração sai do antigo cache-first imediatamente. Nas
    // próximas versões, a estratégia network-first já evita HTML obsoleto.
    if (hadLegacyCache) {
      await Promise.allSettled(
        windowClients.map((client) => client.navigate(client.url)),
      );
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (
    request.method !== 'GET'
    || requestUrl.origin !== self.location.origin
    || requestUrl.pathname.startsWith('/webtorrent/')
    || requestUrl.pathname.startsWith('/_next/')
    || requestUrl.pathname.startsWith('/_vercel/')
    || requestUrl.pathname.startsWith('/api/')
    || requestUrl.hostname === 'localhost'
    || requestUrl.hostname === '127.0.0.1'
  ) {
    return;
  }

  // Documentos nunca usam cache-first. Um deploy novo é buscado na rede e o
  // cache local serve somente como fallback quando o aparelho estiver offline.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(PAGE_CACHE);

      try {
        const preloadResponse = await event.preloadResponse;
        const networkResponse = preloadResponse || await fetch(new Request(request, { cache: 'no-store' }));

        if (networkResponse.ok) {
          event.waitUntil(cache.put(request, networkResponse.clone()));
        }
        return networkResponse;
      } catch {
        return (
          await cache.match(request, { ignoreSearch: true })
          || await cache.match('/')
          || new Response(
            '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width"><title>TotalFlix offline</title><body style="font-family:sans-serif;background:#050008;color:#fff;padding:2rem"><h1>Você está offline</h1><p>Conecte-se à internet e tente novamente.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          )
        );
      }
    })());
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Novo conteúdo disponível no TotalFlix!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: '/' },
  };

  event.waitUntil(self.registration.showNotification('TotalFlix', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/'));
});
