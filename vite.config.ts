import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // SW NUNCA ativa em dev (evita interferência no preview iframe do Lovable)
      devOptions: { enabled: false },
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: false, // mantemos public/manifest.json existente
      workbox: {
        // Não cacheia rotas internas do Lovable nem o callback OAuth
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Limite generoso para apostilas grandes
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // 1) Apostilas (Supabase REST GET) — StaleWhileRevalidate
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              url.hostname.endsWith("supabase.co") &&
              url.pathname.includes("/rest/v1/apostilas"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "apostilas-data",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 2) Materiais e exercícios — StaleWhileRevalidate
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              url.hostname.endsWith("supabase.co") &&
              (url.pathname.includes("/rest/v1/materials") ||
                url.pathname.includes("/rest/v1/exercises") ||
                url.pathname.includes("/rest/v1/apostila_materials")),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "materials-data",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 3) Imagens (qualquer origem) — CacheFirst
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // 4) Google Fonts
          {
            urlPattern: ({ url }) =>
              url.origin === "https://fonts.googleapis.com" ||
              url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        // Fallback para navegação offline → /offline.html
        navigateFallback: "/index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
