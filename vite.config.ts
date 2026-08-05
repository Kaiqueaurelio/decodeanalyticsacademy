import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

export default defineConfig(({ mode }) => ({
  // Keep Vite anchored to the repository root even when a CI runner invokes
  // the build from a different working directory.
  root: __dirname,
  server: {
    host: true,
    port: 8080,
    hmr: {
      host: process.env.VITE_HMR_HOST || undefined,
      port: process.env.VITE_HMR_PORT ? Number(process.env.VITE_HMR_PORT) : undefined,
      overlay: false,
    },
  },
  plugins: [
    react(),
    mcpPlugin(),
    mode === "development" && componentTagger(),
    VitePWA({
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
        // Nao precacheia index.html nem chunks JS hashados. Esses arquivos precisam
        // vir da rede apos deploy para evitar tela preta por app shell antigo.
        globPatterns: ["**/*.{css,ico,svg,woff2,png}", "registerSW.js"],
        globIgnores: ["**/index.html", "**/*.js", "**/sw.js", "**/workbox-*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "decode-pages-v3",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 5 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "script",
            handler: "NetworkFirst",
            options: {
              cacheName: "decode-js-v3",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 10 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "decode-css-v3",
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
              cacheName: "decode-images-v3",
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
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "local",
    ),
    __APP_COMMIT_MESSAGE__: JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_MESSAGE || "",
    ),
    __APP_ENVIRONMENT__: JSON.stringify(
      process.env.VERCEL_ENV || (mode === "production" ? "production" : "development"),
    ),
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
