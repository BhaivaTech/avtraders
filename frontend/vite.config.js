// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "1234.png"],
      manifest: {
        name: "AV Traders Agri Clinic",
        short_name: "AV Traders",
        description: "Agronomy advice, crop protection, and dealer distribution in Karnataka.",
        theme_color: "#48a43f",
        background_color: "#f7fafc",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/1234.png", sizes: "192x192", type: "image/png" },
          { src: "/1234.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Cached shell only for the public read-only routes. /api and /admin
        // are intentionally excluded so live data and CSRF stay fresh.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/, /^\/checkout/, /^\/payment-result/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/clinic") || url.pathname.startsWith("/api/guide"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "av-clinic-guide" },
          },
          {
            urlPattern: ({ request }) => ["image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "av-assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5100",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    target: "es2019",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Must check react-* packages BEFORE the generic react check
            if (id.includes("react-router") || id.includes("@remix-run")) return "vendor-router";
            if (id.includes("react-i18next") || id.includes("i18next")) return "vendor-i18n";
            if (id.includes("react-helmet-async")) return "vendor-helmet";
            if (id.includes("react-hot-toast")) return "vendor-toast";
            if (id.includes("react-hook-form") || id.includes("@hookform")) return "vendor-rhf";
            if (id.includes("socket.io-client")) return "vendor-socket";
            if (id.includes("pdfjs-dist")) return "vendor-pdf";
            // Only core react & react-dom go here (checked last among react-*)
            if (id.includes("/react/") || id.includes("/react-dom/")) return "vendor-react";
            return "vendor";
          }
          if (id.includes("/src/pages/Admin")) return "page-admin";
          return undefined;
        },
      },
    },
  },
});
