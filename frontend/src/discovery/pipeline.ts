import { post } from "./discovery";

function enforce({ rule, name }: { rule: boolean; name: string }) {
	if (rule !== true) {
		throw new Error(`Violated: ${name}`);
	}
}

function postGenerator(endpoint: string) {
	function postFunc({ url, payload = {} }: { url: string; payload?: object }) {
		return post({ url: `${endpoint}/${url}`, payload });
	}
	return postFunc;
}
export const apiEndpoint = "api/pipe";
export const postPipe = postGenerator(apiEndpoint);

function dataAccessor(obj: object) {
	if ("data" in obj) {
		return obj["data"];
	} else {
		return undefined;
	}
}
export async function reset() {
	const output = await postPipe({ url: "reset" });
	enforce({
		rule: output.status === true,
		name: "reset status is true",
	});
	return dataAccessor(output);
}
export async function init({ model }: { model: string }) {
	const output = await postPipe({
		url: "init",
		payload: { model },
	});
	enforce({
		rule: output.status === true,
		name: "init status is true",
	});
	return dataAccessor(output);
}

export async function regionLabeler({
	polygon,
	name,
}: {
	polygon: number[][];
	name: string;
}) {
	const output = await postPipe({
		url: "region-labeler",
		payload: {
			polygon,
			name,
		},
	});
	enforce({
		rule: output.status === true,
		name: "region labeler status is true",
	});
	return dataAccessor(output);
}

export async function idFilter({ ids }: { ids: unknown[] }) {
	const output = await postPipe({
		url: "id-filter",
		payload: {
			ids,
		},
	});
	enforce({
		rule: output.status === true,
		name: "id filter status is true",
	});
	return dataAccessor(output);
}

export async function parametricUMAP({
	umapArgs = {},
}: { umapArgs?: object } = {}) {
	const output = await postPipe({
		url: "umap",
		payload: {
			args: umapArgs,
		},
	});
	enforce({
		rule: output.status === true,
		name: "umap status is true",
	});
	return dataAccessor(output);
}
