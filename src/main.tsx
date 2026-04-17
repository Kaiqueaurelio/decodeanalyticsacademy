import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapSavedRoute } from "@/lib/app-persistence";
import { registerServiceWorker } from "@/lib/pwa";

// PWA install prompt capture — only in production (not in iframe/preview)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (!isPreviewHost && !isInIframe) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as any).__pwaInstallPrompt = e;
  });
}

bootstrapSavedRoute();

// Service Worker (PWA) — só ativa em produção real, fora de iframes
registerServiceWorker();

// Native screenshot prevention (Capacitor only — no-op on web)
import('@capacitor/core').then(({ Capacitor }) => {
  if (Capacitor.isNativePlatform()) {
    import('@capacitor-community/privacy-screen').then(({ PrivacyScreen }) => {
      PrivacyScreen.enable().catch(() => {});
    }).catch(() => {});
  }
}).catch(() => {});

createRoot(document.getElementById("root")!).render(<App />);
