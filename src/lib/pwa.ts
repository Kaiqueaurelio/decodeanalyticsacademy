/**
 * Desativação controlada do service worker de app-shell.
 *
 * Instalações antigas ainda podem manter o documento atual sob controle do
 * worker anterior mesmo depois de `unregister()`. Por isso, quando um worker
 * antigo é removido, fazemos uma única recarga controlada da página. A marca
 * em sessionStorage impede qualquer loop de recarga.
 */

const SERVICE_WORKER_RESET_KEY = 'decode_sw_reset_v2';

function isDecodeAppServiceWorker(registration: ServiceWorkerRegistration): boolean {
  const urls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter(Boolean) as string[];

  return urls.some((scriptUrl) => {
    try {
      const url = new URL(scriptUrl);
      return url.origin === window.location.origin &&
        (url.pathname === '/sw.js' || url.pathname === '/service-worker.js');
    } catch {
      return false;
    }
  });
}

async function unregisterAppServiceWorkers(): Promise<boolean> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const appRegistrations = registrations.filter(isDecodeAppServiceWorker);
    const unregisterResults = await Promise.all(
      appRegistrations.map((registration) => registration.unregister().catch(() => false)),
    );

    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => /^decode-(html|scripts|css|images)-v\d+$/.test(key))
          .map((key) => caches.delete(key).catch(() => false)),
      );
    }

    return unregisterResults.some(Boolean);
  } catch {
    /* Falhas em modo privado não podem impedir o app de montar. */
    return false;
  }
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const removedOldWorker = await unregisterAppServiceWorkers();
  if (!removedOldWorker) {
    try {
      sessionStorage.removeItem(SERVICE_WORKER_RESET_KEY);
    } catch {
      // sessionStorage pode estar indisponível em modos privados.
    }
    return;
  }

  // O documento atual ainda pode estar sob controle do worker removido.
  // Recarregar uma única vez garante que o HTML/JS venha diretamente da rede.
  try {
    if (sessionStorage.getItem(SERVICE_WORKER_RESET_KEY) !== '1') {
      sessionStorage.setItem(SERVICE_WORKER_RESET_KEY, '1');
      window.location.reload();
    }
  } catch {
    // Se a recarga controlada não puder ser agendada, o app continua utilizável.
  }
}
