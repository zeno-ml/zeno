import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [{ file: pkg.module, format: "es" }],
  plugins: [svelte({ emitCss: false }), resolve()],
};
