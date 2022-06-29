module.exports = {
  parser: "@typescript-eslint/parser", // add the TypeScript parser
  plugins: [
    "svelte3",
    "@typescript-eslint", // add the TypeScript plugin
  ],
  env: {
    es6: true,
    browser: true,
  },
  overrides: [
    {
      files: ["*.svelte"],
      processor: "svelte3/svelte3",
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-unsafe-member-access": 0,
        "no-undef": "off",
      },
    },
    {
      files: ["*.ts", "*.json", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/recommended", // Uses the recommended rules from the @typescript-eslint/eslint-plugin
      ],
    },
  ],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    curly: "error",
    "no-var": "error",
    eqeqeq: "error",
  },
  settings: {
    "svelte3/typescript": () => require("typescript"), // pass the TypeScript package to the Svelte plugin
  },
  ignorePatterns: ["node_modules"],
};
