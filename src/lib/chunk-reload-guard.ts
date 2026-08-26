/**
 * Detecta falhas de carregamento de chunks/módulos (geralmente causadas por
 * um deploy novo invalidando os hashes dos arquivos que a aba ainda referencia)
 * e força uma única recarga da página para baixar a versão atual.
 *
 * O guard não apaga caches de outros aplicativos nem remove sessões do Supabase.
 * A marca fica válida até um carregamento estável, evitando loops quando o
 * deployment ainda não está disponível ou quando a rede está instável.
 */
const RELOAD_KEY = '__chunk_reload_attempted__';
const APP_CACHE_RE = /^decode-(html|scripts|css|images)-v\d+$/;

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
    if (sessionStorage.getItem(RELOAD_KEY)) return;
    sessionStorage.setItem(RELOAD_KEY, '1');
  } catch {
    /* sessionStorage indisponível — tenta seguir sem persistência. */
  }

  // Limpa somente caches antigos criados pelo próprio app.
  const reload = () => window.location.reload();
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => APP_CACHE_RE.test(key)).map((key) => caches.delete(key)),
      ))
      .then(reload, reload);
  } else {
    reload();
  }
};

export function installChunkReloadGuard() {
  // Um carregamento estável por 30s libera a marca para uma falha futura.
  window.setTimeout(() => {
    try {
      const root = document.getElementById('root');
      if (root?.children.length) sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      /* noop */
    }
  }, 30_000);

  window.addEventListener('error', (e) => {
    if (isChunkLoadError(e.message)) tryReload();
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (isChunkLoadError(msg)) tryReload();
  });
}
