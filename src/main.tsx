import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installPerfMonitor } from "./lib/perf-monitor";
import { installRuntimeLogger } from "./lib/runtime-logs";

const ELLA_RIBEIRO_AVATAR =
  'https://gynguskgysompgcajunc.supabase.co/storage/v1/object/public/ads/ads/ella-ribeiro-avatar.jpg';

(() => {
  const applyEllaAvatarToImages = () => {
    document.querySelectorAll<HTMLImageElement>('img[alt="Ella Ribeiro"]').forEach((img) => {
      if (img.src !== ELLA_RIBEIRO_AVATAR) img.src = ELLA_RIBEIRO_AVATAR;
    });
  };

  window.addEventListener('DOMContentLoaded', applyEllaAvatarToImages);
  const observer = new MutationObserver(applyEllaAvatarToImages);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();

// Remove credenciais antigas que foram salvas em base64 pelo fluxo "lembrar-me".
// O app pode lembrar apenas o identificador; senha deve ficar com o navegador/gerenciador de senhas.
(() => {
  try {
    localStorage.removeItem('decode_remember_password');

    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      if (key === 'decode_remember_password') return;
      originalSetItem(key, value);
    };
  } catch {
    // Em modos privados ou ambientes restritos, localStorage pode falhar.
  }
})();

installRuntimeLogger();
installPerfMonitor();

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Sanitiza warnings de postMessage do script do editor (preview iframe).
// O lovable.js publica mensagens de tipos que evoluem entre versões; quando
// rodando em sandbox de preview, ignoramos silenciosamente esses tipos
// desconhecidos para não poluir o console do app real.
(() => {
  const IGNORED_PATTERNS = [
    /Unknown message type:/i,
    /postMessage.*origin/i,
    /target origin provided.*does not match/i,
  ];
  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = args.map((a) => (typeof a === 'string' ? a : '')).join(' ');
    if (IGNORED_PATTERNS.some((re) => re.test(msg))) return;
    origWarn(...args);
  };

  // Filtro para mensagens recebidas: aceita apenas origens conhecidas.
  const TRUSTED_ORIGIN_RES = [
    /lovable(project)?\.app$/i,
    /lovableproject\.com$/i,
    /gpteng\.co$/i,
    /^https?:\/\/localhost(:\d+)?$/i,
    new RegExp(`^${window.location.origin}$`, 'i'),
  ];
  window.addEventListener('message', (e) => {
    try {
      const origin = e.origin || '';
      if (!origin) return;
      if (!TRUSTED_ORIGIN_RES.some((re) => re.test(origin))) {
        e.stopImmediatePropagation();
      }
    } catch { /* ignore */ }
  }, true);
})();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
