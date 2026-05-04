import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,

    port: 8080,
    hmr: {
      host: "8080-ixhln5bbrnf0l39u1pa86-b1a0ffa2.us2.manus.computer",

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
        // Importa nosso handler de push (em /sw-push.js)
        importScripts: ["/sw-push.js"],
        // Não cacheia rotas internas do Lovable nem o callback OAuth
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        // Precache apenas do shell crítico (HTML/CSS/fontes/ícones e o entry).
        // Linguagens Shiki, mermaid, cytoscape, charts, pdf, mammoth são
        // pesados e raramente usados — vão para runtimeCaching sob demanda,
        // economizando ~13MB no primeiro acesso (antes: ~16MB).
        globPatterns: ["**/*.{css,html,ico,svg,woff2,png}", "assets/index-*.js", "assets/react-*.js"],
        globIgnores: ["**/sw.js", "**/workbox-*.js"],
        // Tamanho mais conservador: arquivos grandes vêm via runtime cache.
        maximumFileSizeToCacheInBytes: 1.5 * 1024 * 1024,
        runtimeCaching: [
          // 0) Chunks JS dinâmicos (lazy) — CacheFirst com revalidação por hash
          {
            urlPattern: ({ url, request }) =>
              request.destination === "script" &&
              url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "js-chunks",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
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
  build: {
    // Limites maiores: o aviso de chunk grande é informativo
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Separar libs pesadas em chunks próprios.
        // Tudo pesado fica fora do entry inicial — só baixa quando usado.
        manualChunks: {
          // Núcleo crítico (entry inicial)
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          // Lazy: só carregam quando a página/feature requer
          charts: ["recharts"],
          motion: ["framer-motion"],
          pdf: ["pdfjs-dist"],
          mermaid: ["mermaid"],
          mammoth: ["mammoth"],
          shiki: ["shiki"],
          markdown: ["react-markdown"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query"],
  },
}));
