importScripts('/webtorrent-worker.js');

const CACHE_NAME = 'totalflix-v1';
const urlsToCache = [
  '/',
  '/movies',
  '/series',
  '/tv',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Erro ao criar cache:', err);
      })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Apenas esquemas HTTP/HTTPS são suportados pela Cache API (evita erros com chrome-extension://, etc.)
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Chunks do Next mudam a cada build e nunca devem ficar no cache do PWA.
  if (
    event.request.method !== 'GET' ||
    requestUrl.pathname.startsWith('/webtorrent/') ||
    requestUrl.pathname.startsWith('/_next/') ||
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1'
  ) {
    return;
  }

  // Não intercepta requisições de API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrou
        if (response) {
          return response;
        }

        // Faz a requisição na rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Não cacheia se não for GET ou resposta inválida
            if (event.request.method !== 'GET' || !networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clona a resposta para cachear
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                if (event.request.url.startsWith('http')) {
                  cache.put(event.request, responseToCache).catch((err) => {
                    console.warn('Erro ao cachear:', err);
                  });
                }
              })
              .catch((err) => {
                console.error('Erro ao abrir cache:', err);
              });

            return networkResponse;
          })
          .catch(() => {
            // Se falhar na rede e for uma navegação, retorna a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Push notifications (opcional)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Novo conteúdo disponível no TotalFlix!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('TotalFlix', options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
