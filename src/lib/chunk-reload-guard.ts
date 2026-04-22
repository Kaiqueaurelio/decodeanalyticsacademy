/**
 * Detecta falhas de carregamento de chunks/módulos (geralmente causadas por
 * um deploy novo invalidando os hashes dos arquivos que a aba ainda referencia)
 * e força um reload único da página para baixar a versão atual.
 *
 * Usa sessionStorage para evitar loop de reloads (só recarrega 1x por sessão).
 */
const RELOAD_KEY = '__chunk_reload_attempted__';

const isChunkLoadError = (msg: string | undefined): boolean => {
  if (!msg) return false;
  return (
    /Importing a module script failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
};

const tryReload = () => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return; // já tentou uma vez
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    /* sessionStorage indisponível — segue mesmo assim */
  }
  // Limpa caches do Service Worker (PWA) antes de recarregar
  const reload = () => window.location.reload();
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(reload, reload);
  } else {
    reload();
  }
};

export function installChunkReloadGuard() {
  // Limpa o flag se a página carregou normalmente por mais de 5s
  window.setTimeout(() => {
    try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* noop */ }
  }, 5000);

  window.addEventListener('error', (e) => {
    if (isChunkLoadError(e.message)) tryReload();
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (isChunkLoadError(msg)) tryReload();
  });
}
