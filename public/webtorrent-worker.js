// Adaptador oficial do servidor WebTorrent para Service Workers.
let cancellable = false;
const portTimeoutDuration = 5000;

self.addEventListener('fetch', (event) => {
  if (!event.request.url.includes(`${self.registration.scope}webtorrent/`)) return;
  event.respondWith(serveWebTorrentRequest(event));
});

async function serveWebTorrentRequest({ request }) {
  const { url, method, headers, destination } = request;

  if (url.includes(`${self.registration.scope}webtorrent/keepalive/`)) return new Response();
  if (url.includes(`${self.registration.scope}webtorrent/cancel/`)) {
    return new Response(new ReadableStream({ cancel: () => { cancellable = true; } }));
  }

  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (!clientList.length) return new Response('WebTorrent client unavailable', { status: 503 });

  const [data, port] = await new Promise((resolve) => {
    for (const client of clientList) {
      const channel = new MessageChannel();
      channel.port1.onmessage = ({ data }) => resolve([data, channel.port1]);
      client.postMessage({
        url,
        method,
        headers: Object.fromEntries(headers.entries()),
        scope: self.registration.scope,
        destination,
        type: 'webtorrent',
      }, [channel.port2]);
    }
  });

  let timeout;
  const cleanup = () => {
    port.postMessage(false);
    clearTimeout(timeout);
    port.onmessage = null;
  };

  if (data.body !== 'STREAM') {
    cleanup();
    return new Response(data.body, data);
  }

  return new Response(new ReadableStream({
    pull(controller) {
      return new Promise((resolve) => {
        port.onmessage = ({ data }) => {
          if (data) controller.enqueue(data);
          else {
            cleanup();
            controller.close();
          }
          resolve();
        };
        if (!cancellable && destination !== 'document') {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            cleanup();
            resolve();
          }, portTimeoutDuration);
        }
        port.postMessage(true);
      });
    },
    cancel: cleanup,
  }), data);
}
