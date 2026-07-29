/**
 * Registra o service worker apenas no site publicado real.
 * Em preview/iframe/dev, REMOVE qualquer SW e cache para que o preview
 * sempre renderize exatamente o build atual (sem assets antigos em cache).
 */
const PREVIEW_HOST_PATTERNS = [
  "id-preview--",
  "preview--",
  "lovableproject.com",
  "lovableproject-dev.com",
  "beta.lovable.dev",
  "localhost",
];

async function unregisterEverything() {
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
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost = PREVIEW_HOST_PATTERNS.some((p) => host.includes(p));
  // Kill switch manual: abrir o site com ?sw=off limpa cache e SW.
  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";

  if (!import.meta.env.PROD || isInIframe || isPreviewHost || killSwitch) {
    await unregisterEverything();
    return;
  }

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

    const registration = await wb.register();

    // Garante que o site publicado busque o build mais recente ao abrir
    // e sempre que a aba volta a ficar visível — evita divergência com o preview.
    const checkForUpdate = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };
    checkForUpdate();
    document.addEventListener("visibilitychange", checkForUpdate);
  } catch (err) {
    console.warn("[PWA] Service worker registration failed:", err);
  }
}
