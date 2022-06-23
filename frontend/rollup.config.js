import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import sveltePreprocess from "svelte-preprocess";
import typescript from "@rollup/plugin-typescript";
import css from "rollup-plugin-css-only";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/main.ts",
  output: {
    sourcemap: !production,
    format: "es",
    name: "app",
    dir: "../zeno/frontend/build/",
    manualChunks: (id) => {
      if (id.includes("node_modules")) {
        if (id.includes("@smui")) {
          return "vendor_smui";
        } else if (id.includes("arquero") || id.includes("apache-arrow")) {
          return "vendor_arquero";
        } else if (id.includes("@mdi/js")) {
          return "vendor_mdi";
        } else if (id.includes("svelte-vega")) {
          return "vendor_vega";
        }

        return "vendor"; // all other package goes here
      }
    },
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess({ sourceMap: !production }),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance
    css({ output: "bundle.css" }),
    json(),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
