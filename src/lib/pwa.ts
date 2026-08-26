/**
 * Desativação controlada do service worker de app-shell.
 *
 * Instalações antigas ainda serviam HTML/JS em cache e mostravam versões
 * antigas do app. Agora o arquivo público /sw.js é um kill switch: qualquer
 * registro existente é atualizado, limpa os caches do app e se desregistra.
 * Aqui apenas garantimos a remoção imediata em qualquer ambiente.
 */
async function unregisterAppServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) => {
          const url =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            '';
          try {
            return new URL(url).pathname === '/sw.js';
          } catch {
            return false;
          }
        })
        .map((registration) => registration.unregister().catch(() => false)),
    );

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => /^decode-(html|scripts|css|images)-v\d+$/.test(key))
          .map((key) => caches.delete(key).catch(() => false)),
      );
    }
  } catch {
    /* ignore */
  }
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  await unregisterAppServiceWorkers();
}
