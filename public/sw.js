/**
 * Decode Analytics Academy — compatibilidade para service workers antigos.
 *
 * O service worker de produção é gerado pelo Workbox. Este arquivo público
 * existe como fallback de registro e nunca deve manter HTML antigo, navegar
 * abas automaticamente ou desregistrar o worker atual em cada ativação.
 */

const CURRENT_RUNTIME_CACHE_VERSION = 6;
const DECODE_RUNTIME_CACHE_RE = /^decode-(html|scripts|css|images)-v(\d+)$/;

function isObsoleteDecodeCache(cacheName) {
  const match = DECODE_RUNTIME_CACHE_RE.exec(cacheName);
  if (!match) return false;

  const version = Number(match[2]);
  return Number.isInteger(version) && version < CURRENT_RUNTIME_CACHE_VERSION;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter(isObsoleteDecodeCache)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  // Navegação sempre consulta a rede. Assim, um HTML publicado novamente
  // nunca é substituído por uma cópia antiga do Cache Storage.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
  }
});
