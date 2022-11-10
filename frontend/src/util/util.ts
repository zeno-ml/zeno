import type ColumnTable from "arquero/dist/types/table/column-table";

import * as aq from "arquero";
import { get } from "svelte/store";
import {
	filteredTable,
	folders,
	model,
	tab,
	transforms,
	metrics,
	models,
	ready,
	results,
	settings,
	slices,
	table,
	metric,
	reports,
	rowsPerPage,
	lassoSelection,
	startingPointIds,
	report,
} from "../stores";

export function initialFetch() {
	fetch("/api/settings")
		.then((r) => r.json())
		.then((s) => {
			settings.set(s);
			rowsPerPage.set(s.samples);
			fetch("/api/initialize")
				.then((r) => r.json())
				.then((r) => {
					models.set(r.models);
					metrics.set(r.metrics);
					transforms.set(r.transforms);
					folders.set(r.folders);

					model.set(r.models[r.models.length - 1]);
					metric.set(r.metrics[0]);

					ready.set(true);
				});
		});
}

export async function getSlicesAndReports(t) {
	const slicesRes = await fetch("/api/slices").then((d) => d.json());
	const slis = JSON.parse(slicesRes) as Slice[];
	const sliMap = new Map();
	slis.forEach((e) => sliMap.set(e.sliceName, e));
	slices.set(sliMap);

	const reportsRes = await fetch("/api/reports").then((d) => d.json());
	const localReports = JSON.parse(reportsRes) as Report[];
	reports.set(localReports);
}

export function updateTab(t: string) {
	report.set(-1);
	if (t === "home") {
		window.location.hash = "";
	} else {
		window.location.hash = "#/" + t + "/";
	}
	tab.set(t);
}

export async function getMetricsForSlices(metricKeys: MetricKey[]) {
	if (metricKeys.length === 0) {
		return [];
	}
	if (metricKeys[0].metric === undefined) {
		return null;
	}
	const returnValues = metricKeys.map((k) => {
		if (k.sli.sliceName === "overall" || k.sli.sliceName === "") {
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
			body: JSON.stringify(missingColumns),
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

export function columnHash(col: ZenoColumn) {
	return (
		col.columnType +
		col.name +
		(col.model ? col.model : "") +
		(col.transform ? col.transform : "")
	);
}

function arrayEquals(a, b) {
	return (
		Array.isArray(a) &&
		Array.isArray(b) &&
		a.length === b.length &&
		a.every((val, index) => val === b[index])
	);
}

/**
 * Returns another arquero table with with only the ids specified
 */
export function filterTableForIds(t: ColumnTable, ids: string[]) {
	const idHash = columnHash(get(settings).idColumn);
	const idTable = aq.table({ [idHash]: ids });
	const sharedTable = t.join(idTable, idHash);
	return sharedTable;
}

export function updateFilteredTable(t: ColumnTable) {
	if (!get(ready) || t.size === 0) {
		return;
	}

	let tempTable = t;

	// lasso selection only (hack remove this later)
	const lassoSelectionValues = get(lassoSelection);
	const onlyLassoNoFilter = lassoSelectionValues.length > 0;
	if (onlyLassoNoFilter) {
		filteredTable.set(filterTableForIds(t, lassoSelectionValues));
		return; // don't do the other filters so end early
	}

	// in mirror, we start from a starting point, and filter from there
	const startIdsMirror = get(startingPointIds);
	if (startIdsMirror.length < t.size && startIdsMirror.length !== 0) {
		tempTable = filterTableForIds(tempTable, startIdsMirror);
	}

	// metadata and slices
	// tempTable = filterTableWithSlicesAndMetadata(tempTable);

	const idCol = columnHash(get(settings).idColumn);
	if (arrayEquals(tempTable.array(idCol), get(filteredTable).array(idCol))) {
		return;
	}
	if (
		arrayEquals(tempTable.array(idCol), t.array(idCol)) &&
		arrayEquals(tempTable.array(idCol), get(filteredTable).array(idCol))
	) {
		return;
	}

	filteredTable.set(tempTable);
}
