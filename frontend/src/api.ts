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
	results,
	rowsPerPage,
	settings,
	slices,
	transform,
	transforms,
} from "./stores";
import { getMetricRange } from "./util/util";

export async function getInitialData() {
	let res = await fetch("/api/settings");
	const sets = (await res.json()) as Settings;
	settings.set(sets);
	rowsPerPage.set(sets.samples);

	res = await fetch("/api/initialize");
	const r = await res.json();
	models.set(r.models);
	metrics.set(r.metrics);
	transforms.set(r.transforms);
	folders.set(r.folders);

	model.set(r.models.length > 0 ? r.models[r.models.length - 1] : "");
	metric.set(r.metrics.length > 0 ? r.metrics[0] : "");
	transform.set("");

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

export async function getMetricsForSlices(metricKeys: MetricKey[]) {
	if (metricKeys.length === 0 || metricKeys[0].state.metric === undefined) {
		return null;
	}
	const returnValues = metricKeys.map((k) => {
		if (k.sli.sliceName === "") {
			return undefined;
		}
		return get(results).get(k);
	});
	const requiredIndices = returnValues.reduce((arr, curr, i) => {
		if (curr === undefined) {
			arr.push(i);
		}
		return arr;
	}, []);

	if (requiredIndices.length > 0) {
		let res = await fetch("/api/get-metrics-for-slices", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify(requiredIndices.map((i) => metricKeys[i])),
		}).then((d) => d.json());
		res = JSON.parse(res);
		results.update((resmap) => {
			res.forEach((r, i) => resmap.set(metricKeys[i], r));
			return resmap;
		});
		requiredIndices.forEach((r, i) => (returnValues[r] = res[i]));
	}
	return returnValues;
}

export async function getHistograms(
	completeColumns,
	filterPredicates: FilterPredicateGroup[],
	state: ZenoState,
	get_metrics: boolean
) {
	const requestedHistograms = completeColumns.filter(
		(c) =>
			(c.model === "" || c.model === state.model) &&
			(c.transform === "" || c.transform === state.transform) &&
			c.columnType !== ZenoColumnType.OUTPUT &&
			c.columnType !== ZenoColumnType.TRANSFORM
	);
	let res = await fetch("/api/calculate-histograms", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedHistograms,
			filter_predicates: filterPredicates,
			state,
			get_metrics,
		}),
	}).then((res) => res.json());

	res = JSON.parse(res);

	const prevRange = get(metricRange);
	if (get_metrics && prevRange[0] === Infinity) {
		metricRange.set([...getMetricRange(res), true]);
	} else {
		metricRange.update((range) => {
			range[2] = get_metrics;
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
		(c) =>
			(c.model === "" || c.model === state.model) &&
			(c.transform === "" || c.transform === state.transform)
	);
	let res = await fetch("/api/get-filtered-table", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedColumns,
			filter_predicates: filterPredicates,
			state,
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
