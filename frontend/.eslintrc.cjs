module.exports = {
	parser: "@typescript-eslint/parser",
	plugins: ["svelte3", "@typescript-eslint"],
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
				"no-undef": "off",
			},
		},
		{
			files: ["*.ts", "*.json", "*.tsx"],
			extends: ["plugin:@typescript-eslint/recommended"],
		},
	],
	rules: {
		curly: "error",
		"no-var": "error",
		eqeqeq: "error",
	},
	settings: {
		"svelte3/typescript": () => require("typescript"),
	},
	ignorePatterns: ["node_modules"],
};
