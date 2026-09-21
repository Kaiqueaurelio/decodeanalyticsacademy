import { createRoot } from "react-dom/client";
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

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Decode Analytics Academy: elemento #root não encontrado.");
}

const root = createRoot(rootElement);

const renderBootError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  root.render(
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      padding: "24px",
      background: "#050508",
      color: "#f5f5f5",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center",
    }}>
      <section style={{ maxWidth: "560px" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Decode Analytics Academy</h1>
        <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
          O aplicativo encontrou um erro ao iniciar. Recarregue a página para tentar novamente.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "20px",
            border: 0,
            borderRadius: "12px",
            padding: "12px 20px",
            background: "#e8ff47",
            color: "#050508",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Recarregar
        </button>
        <pre style={{
          marginTop: "20px",
          textAlign: "left",
          whiteSpace: "pre-wrap",
          fontSize: "12px",
          opacity: 0.55,
        }}>{message}</pre>
      </section>
    </main>,
  );
};

let bootFinished = false;
const bootTimeout = window.setTimeout(() => {
  if (!bootFinished) {
    renderBootError(new Error("Tempo limite de inicialização excedido."));
  }
}, 10000);

import("./App.tsx")
  .then(({ default: App }) => {
    bootFinished = true;
    window.clearTimeout(bootTimeout);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  })
  .catch((error) => {
    bootFinished = true;
    window.clearTimeout(bootTimeout);
    console.error("Falha ao carregar o módulo principal:", error);
    renderBootError(error);
  });
// Primeiro invalida artefatos de outra versão; depois registra o worker atual.
// Essa ordem evita que um worker antigo reassuma o controle durante a limpeza.
void checkAndCleanOldCaches().finally(() => registerServiceWorker());
// Trigger deploy Tue Aug 18 23:50:52 UTC 2026
