import { ZenoColumnType } from "./globals";
import * as aq from "arquero";
import { get } from "svelte/store";
import {
	filteredTable,
	folders,
	metadataSelections,
	model,
	sliceSelections,
	sort,
	tab,
	transforms,
} from "./stores";

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
import type ColumnTable from "arquero/dist/types/table/column-table";

export function initialFetch() {
	fetch("/api/settings")
		.then((r) => r.json())
		.then((s) => {
			settings.set(s);
			fetch("/api/initialize")
				.then((r) => r.json())
				.then((r) => {
					models.set(r.models);
					metrics.set(r.metrics);
					transforms.set(r.transforms);
					folders.set(r.folders);
					ready.set(true);
				});
		});
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

export function updateFilteredTable(t: ColumnTable) {
	if (!get(ready) || t.size === 0) {
		return;
	}
	let tempTable = t;

	// Filter with slices.
	get(sliceSelections).forEach((s) => {
		const filt = getFilterFromPredicates(get(slices).get(s).filterPredicates);
		tempTable = tempTable.filter(`(d) => ${filt}`);
	});

	// Filter with metadata selections.
	[...get(metadataSelections).entries()].forEach((e) => {
		const [hash, entry] = e;
		if (entry.type === "range") {
			tempTable = tempTable.filter(
				`(r) => r["${hash}"] > ${entry.values[0]} && r["${hash}"] < ${entry.values[1]}`
			);
		} else if (entry.type === "binary") {
			if (entry.values[0] === "is") {
				tempTable = tempTable.filter(`(r) => r["${hash}"] == 1`);
			} else {
				tempTable = tempTable.filter(`(r) => r["${hash}"] == 0`);
			}
		} else {
			tempTable = tempTable.filter(
				aq.escape((r) => aq.op.includes(entry.values, r[hash], 0))
			);
		}
	});

	const s = get(sort);
	if (s) {
		tempTable = tempTable.orderby(columnHash(s));
	}

	filteredTable.set(tempTable);
}
