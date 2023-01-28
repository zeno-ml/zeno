import { DefaultService } from "../testapi";
import { get } from "svelte/store";
import { ZenoColumnType } from "../globals";
import {
	folders,
	metric,
	metrics,
	model,
	models,
	ready,
	reports,
	rowsPerPage,
	settings,
	slices,
} from "../stores";
import { columnHash } from "../util/util";

export async function getInitialData() {
	DefaultService.getSettings().then((d) => console.log(d));
	let res = await fetch("/api/settings");
	const sets = (await res.json()) as Settings;
	settings.set(sets);
	rowsPerPage.set(sets.samples);

	res = await fetch("/api/initialize");
	const r = await res.json();
	models.set(r.models);
	metrics.set(r.metrics);
	folders.set(r.folders);

	model.set(r.models.length > 0 ? r.models[r.models.length - 1] : "");
	metric.set(r.metrics.length > 0 ? r.metrics[0] : "");

	const slicesRes = await fetch("/api/slices").then((d) => d.json());
	slices.set(new Map(Object.entries(slicesRes)));

	const reportsRes = await fetch("/api/reports").then((d) => d.json());
	reports.set(reportsRes);

	ready.set(true);
}

/**
 * Request the 2D representation of the embeddings from the backend.
 * This might take some time if not cached (based on model)
 *
 * @returns list of 2D coordinates
 */
export async function projectEmbedInto2D(
	model: string,
	column: ZenoColumn
): Promise<Points2D> {
	const body = { model, column };
	const req = await fetch("/api/embed-project", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (req.ok) {
		const result = (await req.json()) as Points2D;
		result.x = new Float32Array(result.x);
		result.y = new Float32Array(result.y);
		result.color = new Float32Array(result.color);
		return result;
	} else {
		console.error(
			"Error making projection request to backend (http request failed)",
			req
		);
		const empty = {
			x: new Float32Array(),
			y: new Float32Array(),
			color: new Float32Array(),
			ids: [],
		};
		return empty;
	}
}

/**
 * Check in the backend table if the embeddings data
 * even exists at all.
 *
 * @returns true if exist, and false if not or if the request errors out
 */
export async function checkEmbedExists(model: string) {
	const req = await fetch(`api/embed-exists/${model}`);
	if (req.ok) {
		const exists = (await req.json()) as boolean;
		return exists;
	} else {
		console.error(
			"Error checking if embeddings exist (http request failed)",
			req
		);
		return false;
	}
}

export async function getEntry(id: string, columns?: string[]) {
	const body = { id, columns };
	const req = await fetch("/api/entry", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (req.ok) {
		const result = JSON.parse(await req.json());
		return result;
	} else {
		console.error("Error ", req);
		const empty = {};
		return empty;
	}
}

/**
 * from the zeno global state, fetches the
 * column name for model output
 */
export function modelOutputColumnName() {
	const modelColumn = {
		columnType: ZenoColumnType.OUTPUT,
		name: get(model),
	} as ZenoColumn;
	const modelColumnStr = model ? columnHash(modelColumn) : "";
	return modelColumnStr;
}

/**
 * Creates the view component from the view function
 * @param override takes in a HTMLDivElement that the viewFunction can
 * 					optionally override instead of creating a new div
 * @returns the component as a div element
 */
export function createViewComponent(
	viewFunction: View.Component,
	entry: View.Entry,
	options: View.Options,
	override?: HTMLDivElement
): HTMLDivElement {
	const modelColumn = modelOutputColumnName();

	// if no override, create a new div
	override ??= document.createElement("div");

	// overrides the passed in element with view
	const globalSettings = get(settings);
	viewFunction(
		override,
		options,
		entry,
		modelColumn,
		columnHash(globalSettings.labelColumn),
		columnHash(globalSettings.dataColumn),
		globalSettings.dataOrigin,
		columnHash(globalSettings.idColumn)
	);

	return override;
}
