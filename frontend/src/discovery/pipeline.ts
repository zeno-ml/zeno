import type { TypedArray } from "arquero/dist/types/table/table";
import { enforce } from "../util";
import request from "../request";

export const apiEndpoint = "api/pipe";
export const postPipe = request.generator.post(apiEndpoint);
export const getPipe = request.generator.get(apiEndpoint);

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
export async function init({ model, uid }: { model: string; uid?: string }) {
	const output = await postPipe({
		url: "init",
		payload: { model, uid },
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

export async function idFilter({ ids }: { ids: any[] | TypedArray }) {
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

export async function pipelineJSON() {
	const output = await getPipe({ url: "graph" });
	enforce({
		rule: output.status === true,
		name: "umap status is true",
	});
	return dataAccessor(output);
}

export async function load({ model, uid }: { model: string; uid: string }) {
	const output = await postPipe({
		url: "load",
		payload: { model, uid },
	});
	enforce({
		rule: output.status === true,
		name: "load status is true",
	});
	return dataAccessor(output);
}
