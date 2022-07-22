import { ZenoColumnType } from "./globals";
import * as aq from "arquero";
import { get } from "svelte/store";
import { model, tab, transforms } from "./stores";

import {
	metrics,
	models,
	ready,
	results,
	settings,
	slices,
	table,
	reports,
} from "./stores";

export function initialFetch() {
	const fetchSettings = fetch("/api/settings")
		.then((r) => r.json())
		.then((s) => {
			settings.set(s);
		});
	const fetchModels = fetch("/api/models")
		.then((d) => d.json())
		.then((d) => models.set(JSON.parse(d)));
	const fetchMetrics = fetch("/api/metrics")
		.then((d) => d.json())
		.then((d) => metrics.set(JSON.parse(d)));
	const fetchTransforms = fetch("/api/transforms")
		.then((d) => d.json())
		.then((d) => transforms.set(JSON.parse(d)));

	const allRequests = Promise.all([
		fetchSettings,
		fetchModels,
		fetchMetrics,
		fetchTransforms,
	]);

	allRequests.then(() => ready.set(true));
}

export async function getSlicesAndReports(t) {
	const slicesRes = await fetch("/api/slices").then((d) => d.json());
	const slis = JSON.parse(slicesRes) as Slice[];
	slis.forEach((s: Slice) => {
		if (s.filterPredicates.length !== 0) {
			s.idxs = t
				.filter("(d) => " + getFilterFromPredicates(s.filterPredicates))
				.array(columnHash(get(settings).idColumn));
		}
	});
	const sliMap = new Map();
	slis.forEach((e) => sliMap.set(e.sliceName, e));
	slices.set(sliMap);

	const reportsRes = await fetch("/api/reports").then((d) => d.json());
	const localReports = JSON.parse(reportsRes) as Report[];
	reports.set(localReports);
}

export function updateTab(t: string) {
	if (t === "home") {
		window.location.hash = "";
	} else {
		window.location.hash = "#/" + t + "/";
	}
	tab.set(t);
}

export async function getMetricsForSlices(metricKeys: MetricKey[]) {
	if (metricKeys[0].metric === undefined) {
		return new Array(metricKeys.length).fill("");
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
		let res = await fetch("/api/results", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				requests: requiredIndices.map((i) => metricKeys[i]),
			}),
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

export function updateSliceIdxs() {
	slices.update((slis) => {
		slis.forEach((sli) => {
			sli.idxs = get(table)
				.filter("(d) => " + getFilterFromPredicates(sli.filterPredicates))
				.array(columnHash(get(settings).idColumn));
			slis.set(sli.sliceName, sli);
		});
		return slis;
	});
}

export function getFilterFromPredicates(predicates: FilterPredicate[]) {
	if (predicates.length === 0) {
		return "true";
	}
	const stringPreds = predicates.map((p: FilterPredicate, i) => {
		if (p.column.columnType === ZenoColumnType.POSTDISTILL) {
			p.column.model = get(model);
		}
		let join = "";
		if (i !== 0) {
			join = p.join;
		}

		let ret = "";

		if (p.groupIndicator === "start" && join) {
			ret += "&& (";
		} else if (p.groupIndicator === "start") {
			ret += "(";
		}

		const hash = columnHash(p.column);

		if (join === "") {
			ret +=
				`(d["${hash}"]` +
				" " +
				p.operation +
				" " +
				(isNaN(parseFloat(p.value)) ? `"${p.value}"` : p.value) +
				")";
		} else {
			ret +=
				(join === "AND" ? "&&" : "||") +
				" (" +
				`d["${hash}"]` +
				" " +
				p.operation +
				" " +
				(isNaN(parseFloat(p.value)) ? `"${p.value}"` : p.value) +
				")";
		}

		if (p.groupIndicator === "end") {
			ret += ")";
		}

		return ret;
	});

	return stringPreds.join(" ");
}

export function updateTableColumns(w: WSResponse) {
	let t = get(table);

	const tableColumns = t.columnNames();
	const missingColumns = w.completeColumns.filter(
		(c) => !tableColumns.includes(columnHash(c))
	);
	if (missingColumns.length > 0) {
		fetch("/api/table", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({ columns: missingColumns }),
		})
			.then((d: Response) => d.arrayBuffer())
			.then((d) => {
				if (t.size === 0) {
					t = aq.fromArrow(d);
				} else {
					t = t.assign(aq.fromArrow(d));
				}
				table.set(t);

				// TODO: move somewhere more logical.
				if (get(slices).size === 0 && w.doneProcessing) {
					getSlicesAndReports(t);
				}
			});
	}
}

export function updateReports(reps) {
	fetch("/api/update-reports", {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({ reports: reps }),
	}).then((d: Response) => d.json());
}

export function columnHash(col: ZenoColumn) {
	return (
		col.columnType +
		col.name +
		(col.model ? col.model : "") +
		(col.transform ? col.transform : "")
	);
}

export function enforce({ rule, name }: { rule: boolean; name: string }) {
	if (rule !== true) {
		throw new Error(`Violated: ${name}`);
	}
}

export function extentXY<T>(
	data: T[],
	xGetter = (d: T) => d[0],
	yGetter = (d: T) => d[1]
) {
	const firstPoint = data[0];
	const xExtent = { min: xGetter(firstPoint), max: xGetter(firstPoint) };
	const yExtent = { min: yGetter(firstPoint), max: yGetter(firstPoint) };
	for (let i = 1; i < data.length; i++) {
		const value = data[i];
		const xValue = xGetter(value),
			yValue = yGetter(value);
		// mins
		if (xValue < xExtent.min) {
			xExtent.min = xValue;
		}
		if (yValue < yExtent.min) {
			yExtent.min = yValue;
		}
		// maxs
		if (xValue > xExtent.max) {
			xExtent.max = xValue;
		}
		if (yValue > yExtent.max) {
			yExtent.max = yValue;
		}
	}
	return { xExtent, yExtent };
}
