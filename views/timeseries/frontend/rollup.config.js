import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [{ file: pkg.module, format: "es" }],
  plugins: [json(), commonjs(), svelte({ emitCss: false }), resolve()],
};
