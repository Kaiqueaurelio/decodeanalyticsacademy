/**
 * Decode Analytics Academy — worker de desativação (kill switch).
 *
 * Este arquivo substitui o service worker antigo no MESMO caminho (/sw.js).
 * Ele apaga apenas os caches do próprio app, recarrega as abas abertas e
 * remove o registro, garantindo que ninguém continue vendo uma versão antiga.
 * Workers de mensagens (push) usam outro arquivo e não são afetados.
 */

function isAppCacheForThisRegistration(name) {
  const isWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  const isDecodeBucket = /^decode-(html|scripts|css|images)-v\d+$/.test(name);
  return isDecodeBucket || (isWorkboxBucket && name.endsWith(self.registration.scope));
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appCacheNames = cacheNames.filter(isAppCacheForThisRegistration);
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
