// офлайн-кэш: приложение открывается в зале даже без сети
const C = 'ppl-v2';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true}).then(r => r ||
      fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.ok) {
          const cl = resp.clone();
          caches.open(C).then(c => c.put(e.request, cl));
        }
        return resp;
      })
    ).catch(() => caches.match('./index.html'))
  );
});
