/**
 * Limpeza segura de caches de runtime do Decode Analytics Academy.
 *
 * O HTML e o service worker são controlados pelos headers do servidor e pelo
 * Workbox. Este módulo atua apenas como compatibilidade para instalações que
 * ainda carregam os caches nomeados pelas versões anteriores do aplicativo.
 */

const CURRENT_VERSION = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'test';
const CURRENT_RUNTIME_CACHE_VERSION = 6;
const DECODE_RUNTIME_CACHE_RE = /^decode-(html|scripts|css|images)-v(\d+)$/;

/** Retorna true somente para caches de runtime do app anteriores à v6. */
export function isObsoleteDecodeCache(cacheName: string): boolean {
  const match = DECODE_RUNTIME_CACHE_RE.exec(cacheName);
  if (!match) return false;

  const version = Number(match[2]);
  return Number.isInteger(version) && version < CURRENT_RUNTIME_CACHE_VERSION;
}

async function removeObsoleteDecodeCaches(): Promise<string[]> {
  if (!('caches' in window)) return [];

  const cacheNames = await caches.keys();
  const obsoleteCacheNames = cacheNames.filter(isObsoleteDecodeCache);

  await Promise.all(obsoleteCacheNames.map((cacheName) => caches.delete(cacheName)));
  return obsoleteCacheNames;
}

/**
 * Atualiza a marca local e solicita uma verificação do registro atual do SW.
 * Não apaga Cache Storage inteiro, não remove registros de outros escopos e
 * não força reload: a navegação seguinte já receberá o HTML validado na rede.
 */
export async function checkAndCleanOldCaches(): Promise<void> {
  try {
    const removedCacheNames = await removeObsoleteDecodeCaches();

    if (removedCacheNames.length > 0) {
      console.info('[CacheBuster] Caches antigos removidos:', removedCacheNames);
    }

    localStorage.setItem('decode_app_version', CURRENT_VERSION);

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) => registration.scope === `${window.location.origin}/`)
          .map((registration) => registration.update().catch(() => undefined)),
      );
    }
  } catch (error) {
    // Falhas de Cache Storage ou de modo privado não podem impedir o app de montar.
    console.error('[CacheBuster] Não foi possível validar caches antigos:', error);
  }
}
