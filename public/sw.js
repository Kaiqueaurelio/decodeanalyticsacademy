/**
 * Decode Analytics Academy - SW Kill Switch
 * Este Service Worker substitui qualquer versão antiga, limpa todos os caches e se desregistra imediatamente.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[KillSwitch] Deletando cache obsoleto:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[KillSwitch] Todos os caches removidos. Desregistrando Service Worker...');
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Força todas as abas abertas a recarregarem com a versão nova da nuvem
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url);
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Passa direto para a rede, sem interceptar
  event.respondWith(fetch(event.request));
});
