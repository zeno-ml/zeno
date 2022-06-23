import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "../zeno/frontend/build",
    manifest: true,
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: "src/main.ts",
      },
    },
  },
  optimizeDeps: {
    include: [
      "fast-deep-equal",
      "semver",
      "json-stringify-pretty-compact",
      "clone",
      "fast-json-stable-stringify",
    ],
  },
});
