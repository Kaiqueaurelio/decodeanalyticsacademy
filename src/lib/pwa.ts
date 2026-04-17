/**
 * Registra o service worker apenas em produção e fora de iframes/preview.
 * Em preview/iframe, REMOVE qualquer SW existente para evitar cache "preso".
 */
export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  // Em preview ou iframe: limpa qualquer SW e cache existente
  if (isInIframe || isPreviewHost) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    return;
  }

  // Produção real: registra o SW gerado pelo vite-plugin-pwa
  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox("/sw.js");

    wb.addEventListener("waiting", () => {
      // Nova versão disponível — ativa imediatamente
      wb.messageSkipWaiting();
    });

    wb.addEventListener("controlling", () => {
      window.location.reload();
    });

    await wb.register();
  } catch (err) {
    console.warn("[PWA] Service worker registration failed:", err);
  }
}
