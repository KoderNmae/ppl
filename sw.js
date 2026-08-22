// офлайн-кэш: приложение открывается в зале даже без сети
const C = 'ppl-v47';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  // чужие домены (Rutube, постеры) — напрямую в сеть, без кэша
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // страница: сеть прежде кэша — свежая версия видна сразу, кэш только как офлайн-запас
  if (e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request, {cache: 'no-cache'}).then(resp => {
        if (resp.ok){ const cl = resp.clone(); caches.open(C).then(c => c.put('./index.html', cl)); }
        return resp;
      }).catch(() => caches.match('./index.html', {ignoreSearch: true}))
    );
    return;
  }
  // остальное своё — кэш прежде сети
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
