import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

export default defineConfig(({ mode }) => {
  const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || process.env.VITE_BUILD_VERSION || `local-${Date.now()}`;

  return {
  server: {
    host: true,
    allowedHosts: [".manus.computer"],
    port: 8080,
    hmr: {
      host: process.env.VITE_HMR_HOST || undefined,
      port: process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : undefined,
      overlay: false,
    },
  },
  plugins: [
    {
      name: 'decode-build-version',
      transformIndexHtml(html: string) {
        return html.replaceAll('__DECODE_BUILD_VERSION__', buildVersion);
      },
    },
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    // Service worker de app-shell desativado de propósito: instalações antigas
    // serviam HTML/JS em cache e exibiam versões antigas do app. O arquivo
    // público /sw.js agora é um kill switch que limpa caches e se desregistra.
  ].filter(Boolean),
  define: {
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_COMMIT__: JSON.stringify(
      buildVersion,
    ),
    __APP_COMMIT_MESSAGE__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_MESSAGE || "",
    ),
    __APP_ENVIRONMENT__: JSON.stringify(
      process.env.VERCEL_ENV || (mode === "production" ? "production" : "development"),
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
