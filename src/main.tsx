import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/apostila-responsive.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installPerfMonitor } from "./lib/perf-monitor";
import { installRuntimeLogger } from "./lib/runtime-logs";
import { checkAndCleanOldCaches } from "./lib/cacheBuster";
import { registerServiceWorker } from "./lib/pwa";

// Remove credenciais antigas que foram salvas em base64 pelo fluxo "lembrar-me".
// O app pode lembrar apenas o identificador; senha deve ficar com o navegador/gerenciador de senhas.
(() => {
  try {
    localStorage.removeItem("decode_remember_password");

    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      if (key === "decode_remember_password") return;
      originalSetItem(key, value);
    };
  } catch {
    // Em modos privados ou ambientes restritos, localStorage pode falhar.
  }
})();

installRuntimeLogger();
installPerfMonitor();

window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

// Sanitiza warnings de postMessage do script do editor (preview iframe).
// O script do editor publica mensagens de tipos que evoluem entre versões; quando
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
    const msg = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
    if (IGNORED_PATTERNS.some((re) => re.test(msg))) return;
    origWarn(...args);
  };

  const TRUSTED_ORIGINS = new Set([
    "https://decodeanalyticsacademy.lovable.app",
    "https://decodeanalyticsacademy.vercel.app",
    "https://id-preview--4dd1aec2-9175-4ae9-9401-8637f1ffe1a2.lovable.app",
    "https://decodeanalyticsacademy.com.br",
    "https://www.decodeanalyticsacademy.com.br",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    window.location.origin,
  ]);
  window.addEventListener(
    "message",
    (e) => {
      const origin = e.origin || "";
      if (!origin || !TRUSTED_ORIGINS.has(origin)) {
        e.stopImmediatePropagation();
      }
    },
    true,
  );
})();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
// Primeiro invalida artefatos de outra versão; depois registra o worker atual.
// Essa ordem evita que um worker antigo reassuma o controle durante a limpeza.
void checkAndCleanOldCaches().finally(() => registerServiceWorker());
// Trigger deploy Tue Aug 18 23:50:52 UTC 2026
