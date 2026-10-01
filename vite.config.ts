import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 本番の functions/r2-proxy と同じく R2_ORIGIN / R2_READ_TOKEN で切り替える
      "/r2-proxy": {
        target: process.env.R2_ORIGIN || "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev",
        changeOrigin: true,
        headers: process.env.R2_READ_TOKEN ? { "X-R2-Token": process.env.R2_READ_TOKEN } : undefined,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ""),
      },
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
