import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { resolveApiBaseUrl } from "./src/config/apiBaseUrl.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Fail the production build with a clear diagnostic instead of shipping a
  // bundle that quietly sends API traffic to localhost.
  resolveApiBaseUrl({ mode, apiUrl: env.VITE_API_URL });

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
