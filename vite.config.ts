import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/r2-proxy": {
        target: "https://pub-f189d9c407d749eaa795a0cb8bc05849.r2.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ""),
      },
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true,
      },
    },
  },
});
