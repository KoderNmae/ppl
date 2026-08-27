// офлайн-кэш: приложение открывается в зале даже без сети
const C = 'ppl-v802';
const BG = 'ppl-bg2';   // фоны тем: вечный кэш; при замене картинки меняем ?v=N в CSS
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html'])).then(() => self.skipWaiting()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== BG).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // чужие домены (Rutube, постеры) — напрямую в сеть, без кэша
  if (u.origin !== self.location.origin) return;
  // version.json всегда из сети — по нему приложение узнаёт об обновлениях
  if (u.pathname.endsWith('version.json')) return;
  // фоновые картинки тем: кэш прежде сети, отдельное вечное хранилище
  if (/bg-[\w-]+\.jpg$/.test(u.pathname)){
    e.respondWith(
      caches.match(e.request).then(r => r ||
        fetch(e.request).then(resp => {
          if (resp.ok){ const cl = resp.clone(); caches.open(BG).then(c => c.put(e.request, cl)); }
          return resp;
        })
      )
    );
    return;
  }
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
