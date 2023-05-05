import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: "../zeno/frontend/build",
		manifest: true,
		target: "esnext",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: "src/main.ts",
			},
		},
	},
});
