import { parse } from "node-html-parser";
import fs from "fs";

// Change the livereload index file to the static built svelte files for publishing.
fs.readFile("../zeno/frontend/index.html", "utf8", (err, data) => {
	const index = parse(data);
	const body = index.querySelector("body");
	const header = index.querySelector("head");

	let bodyTags = `<div id="app"></div>`;
	let headerTags = ``;

	fs.readFile(
		"../zeno/frontend/build/manifest.json",
		"utf8",
		(err, manifest) => {
			manifest = JSON.parse(manifest);
			Object.values(manifest).forEach((file) => {
				if (file.file.endsWith(".js")) {
					bodyTags += `<script type="module" src="./build/${file.file}"></script>`;
				} else if (file.file.endsWith(".css")) {
					headerTags += `<link rel="stylesheet" href="./build/${file.file}">`;
				}
			});
			body.innerHTML = bodyTags;
			header.innerHTML = header.innerHTML + headerTags;
			fs.writeFileSync("../zeno/frontend/index_tmp.html", index.toString());
		}
	);
});
