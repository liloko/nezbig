import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Незбіг",
        short_name: "Незбіг",
        theme_color: "#2ec4b6",
        icons: [{ src: "/logo.jpg", sizes: "192x192", type: "image/jpeg" }]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787"
    }
  },
  preview: {
    proxy: {
      "/api": "http://127.0.0.1:8787"
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/client/testSetup.ts"],
    exclude: ["node_modules", "tests/**"]
  }
});
