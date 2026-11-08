import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // When VITE_API_URL is a RELATIVE path (e.g. "/api"), the browser calls the
  // Vite dev server same-origin and Vite proxies to the real backend below.
  // This avoids CORS entirely in development without changing the backend.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim();
  const apiBase = env.VITE_API_URL?.trim() ?? "";
  const useProxy = apiBase.startsWith("/") && !!proxyTarget;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: useProxy
        ? {
            [apiBase]: {
              target: proxyTarget,
              changeOrigin: true,
              // Strip the proxy prefix so "/api/predict" -> "<target>/predict".
              rewrite: (p) =>
                p.replace(new RegExp(`^${apiBase}`), ""),
            },
          }
        : undefined,
    },
  };
});
