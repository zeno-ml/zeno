import * as aq from "arquero";
import { get } from "svelte/store";
import { metric, model, tab, transform, transforms } from "./stores";

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
	getMetrics(slis);
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

export function getMetrics(slices: Slice[]) {
	// TODO: Make fetching overall and current selection clearner, formal API
	const requiredSlices = slices.filter((s) => {
		if (s.sliceName === "") {
			return true;
		}
		const res = get(results).get({
			slice: s.sliceName,
			metric: get(metric),
			transform: get(transform),
			model: get(model),
		});
		return res ? false : true;
	});
	fetch("/api/results", {
		method: "POST",
		headers: {
			"Content-type": "application/json",
		},
		body: JSON.stringify({ slices: requiredSlices }),
	})
		.then((d) => d.json())
		.then((res) => {
			res = JSON.parse(res);
			results.update((resmap) => {
				res.forEach((r) => {
					resmap.set(
						<ResultKey>{
							slice: r.slice,
							metric: r.metric,
							transform: r.transform,
							model: r.model,
						},
						r.value
					);
				});
				return resmap;
			});
		})
		.catch((e) => console.log(e));
}

export function getFilterFromPredicates(predicates: FilterPredicate[]) {
	const stringPreds = predicates.map((p: FilterPredicate, i) => {
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
	return col.columnType + col.name + col.model + col.transform;
}
