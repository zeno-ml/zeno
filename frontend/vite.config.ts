import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "../zeno/frontend",
    target: "es2022",
    chunkSizeWarningLimit: 600,
  },
});
