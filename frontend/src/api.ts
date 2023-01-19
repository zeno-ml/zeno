import { get } from "svelte/store";
import { ZenoColumnType } from "./globals";
import {
	folders,
	metric,
	metricRange,
	metrics,
	model,
	models,
	ready,
	reports,
	rowsPerPage,
	settings,
	slices,
	zenoState,
} from "./stores";
import { getMetricRange, columnHash } from "./util/util";

export async function getInitialData() {
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
	const slis = JSON.parse(slicesRes) as Slice[];
	const sliMap = new Map();
	slis.forEach((e) => sliMap.set(e.sliceName, e));
	slices.set(sliMap);

	const reportsRes = await fetch("/api/reports").then((d) => d.json());
	const localReports = JSON.parse(reportsRes) as Report[];
	reports.set(localReports);

	ready.set(true);
}

function instanceOfFilterPredicate(object): object is FilterPredicate {
	return "column" in object;
}

function setModelForMetricKey(
	pred: FilterPredicate | FilterPredicateGroup,
	state: ZenoState
) {
	if (instanceOfFilterPredicate(pred)) {
		if (pred.column.columnType === ZenoColumnType.POSTDISTILL) {
			pred.column.model = state.model;
		}
	} else {
		pred.predicates = pred.predicates.map((p) =>
			setModelForMetricKey(p, state)
		);
	}
	return pred;
}

function setModelForMetricKeys(metricKeys: MetricKey[]) {
	return metricKeys.map((key) => {
		if (key.sli.filterPredicates) {
			key.sli.filterPredicates = setModelForMetricKey(
				key.sli.filterPredicates,
				key.state
			);
		}
		return key;
	});
}

export async function getMetricsForSlices(metricKeys: MetricKey[]) {
	if (metricKeys.length === 0 || metricKeys[0].state.metric === undefined) {
		return null;
	}
	// Update model in predicates if slices are dependent on postdistill columns.
	metricKeys = setModelForMetricKeys(metricKeys);

	if (metricKeys.length > 0) {
		const res = await fetch("/api/get-metrics-for-slices", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify(metricKeys),
		}).then((d) => d.json());
		return JSON.parse(res);
	}
}

export async function getHistograms(
	completeColumns: ZenoColumn[],
	filterPredicates: FilterPredicateGroup[],
	state: ZenoState,
	getMetrics: boolean
) {
	const requestedHistograms = completeColumns.filter(
		(c) =>
			(c.model === "" || c.model === state.model) &&
			c.columnType !== ZenoColumnType.OUTPUT
	);
	if (state.model === undefined) {
		state.model = "";
	}
	if (state.metric === undefined) {
		state.metric = "";
	}
	let res = await fetch("/api/calculate-histograms", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedHistograms,
			filterPredicates: filterPredicates,
			state,
			getMetrics,
		}),
	}).then((res) => res.json());

	res = JSON.parse(res);

	const prevRange = get(metricRange);
	if (
		getMetrics &&
		(prevRange[0] === Infinity ||
			(prevRange[0] === null && prevRange[1] === null))
	) {
		// If we want to get metric range and haven't before
		metricRange.set([...getMetricRange(res), true]);
	} else {
		// Otherwise, set the previous range
		metricRange.update((range) => {
			range[2] = getMetrics;
			return [...range];
		});
	}
	return res;
}

export async function getFilteredIds(filterPredicates: FilterPredicateGroup[]) {
	let res = await fetch("/api/get-filtered-ids", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(filterPredicates),
	}).then((res) => res.json());
	res = JSON.parse(res);
	return res;
}

export async function getFilteredTable(
	completeColumns,
	filterPredicates: FilterPredicateGroup[],
	state: ZenoState,
	sliceRange: [number, number],
	sort: [ZenoColumn, boolean]
) {
	const requestedColumns = completeColumns.filter(
		(c) => c.model === "" || c.model === state.model
	);
	let res = await fetch("/api/get-filtered-table", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedColumns,
			filterPredicates: filterPredicates,
			sliceRange,
			sort,
		}),
	}).then((res) => res.json());
	res = JSON.parse(res);
	return res;
}

export async function createNewSlice(
	sliceName: string,
	predicateGroup: FilterPredicateGroup,
	folder = ""
) {
	let res = await fetch("/api/create-new-slice", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sliceName: sliceName,
			folder,
			filterPredicates: predicateGroup,
		} as Slice),
	}).then((res) => res.json());
	res = JSON.parse(res);
	return res;
}

export async function deleteSlice(sliceName: string) {
	await fetch("/api/delete-slice", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify([sliceName]),
	});
}

/**
 * Request the 2D representation of the embeddings from the backend.
 * This might take some time if not cached (based on model)
 *
 * @returns list of 2D coordinates
 */
export async function projectEmbedInto2D(model: string): Promise<Points2D> {
	const body = { model };
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
		return result;
	} else {
		console.error(
			"Error making projection request to backend (http request failed)",
			req
		);
		const empty = {
			x: new Float32Array(),
			y: new Float32Array(),
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
	const { model } = get(zenoState);
	const modelColumn = {
		columnType: ZenoColumnType.OUTPUT,
		name: model,
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
