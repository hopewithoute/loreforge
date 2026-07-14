import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

const backendOrigin = "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: backendOrigin,
        changeOrigin: true,
      },
      "/media": {
        target: backendOrigin,
        changeOrigin: true,
      },
    },
  },
});
