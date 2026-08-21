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
    mode === "production" && VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "robots.txt", "icon-192.png", "icon-512.png"],
      manifest: false,
      workbox: {
        importScripts: ["/sw-push.js"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /^\/\.lovable\/oauth/, /^\/functions\/v1/],
        // O app usa code splitting por rota. Não precachear todos os chunks JS
        // evita baixar dezenas de megabytes no primeiro acesso; scripts e imagens
        // continuam disponíveis via as estratégias de runtime abaixo.
        globPatterns: ["**/*.css", "**/*.{ico,svg,woff2}"],
        globIgnores: ["index.html", "sw.js", "workbox-*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst", // Tenta rede, volta para cache se offline
            options: {
              // v6: reduz a janela em que uma falha de rede pode restaurar uma interface antiga.
              cacheName: "decode-html-v6",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 3, maxAgeSeconds: 60 * 60 },
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "script",
            handler: "NetworkFirst", // Tenta rede, volta para cache se offline
            options: {
              cacheName: "decode-scripts-v6",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            }
          },
          {
            urlPattern: ({ request }) => request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "decode-css-v6",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "decode-images-v6",
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
        navigateFallback: "/index.html",
      },
    }),
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
