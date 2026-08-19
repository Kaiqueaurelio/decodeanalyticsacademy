/**
 * Decode Analytics Academy - Cache Buster & SW Cleaner
 * Garante que o navegador nunca fique preso em versões antigas (rollbacks de cache).
 */

const CURRENT_VERSION = '2026.08.18.v4';

export async function checkAndCleanOldCaches() {
  try {
    const storedVersion = localStorage.getItem('decode_app_version');
    if (storedVersion !== CURRENT_VERSION) {
      console.warn('[CacheBuster] Nova versão detectada. Limpando caches antigos...', {
        old: storedVersion,
        new: CURRENT_VERSION,
      });

      // Limpa todos os caches do navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Desregistra service workers antigos
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      localStorage.setItem('decode_app_version', CURRENT_VERSION);
      
      // Força reload suave se não for o primeiro load
      if (storedVersion) {
        window.location.reload();
      }
    }
  } catch (e) {
    console.error('[CacheBuster] Erro ao limpar caches:', e);
  }
}
