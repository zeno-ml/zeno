import type ColumnTable from "arquero/dist/types/table/column-table";

import {
	interpolateOranges,
	schemeCategory10,
	schemeTableau10,
} from "d3-scale-chromatic";

import { MetadataType, ZenoColumnType } from "../globals";
import { interpolateColorToArray } from "../util/metadataUtil";

// export function colorDomain(domain: MetadataCellDomain[], type: MetadataType) {
// 	if (domain.length === 0) {
// 		return;
// 	}

// 	if (type === MetadataType.NOMINAL || type === MetadataType.BOOLEAN) {
// 		const colors20 = [...schemeTableau10, ...schemeCategory10];
// 		let colors = colors20.slice(0, domain.length);
// 		if (domain.length === 2) {
// 			colors = [schemeTableau10[0], schemeTableau10[2]];
// 		}
// 		domain.forEach((d, i) => (d["color"] = colors[i]));
// 	} else if (type === MetadataType.CONTINUOUS) {
// 		const numBins = domain.length;
// 		const colors = interpolateColorToArray(
// 			interpolateOranges,
// 			numBins,
// 			[0.15, 1.0]
// 		);
// 		domain.forEach((d, i) => (d["color"] = colors[i]));
// 	}
// }

// 1) getProj() -> [id, x, y]
// 2) lasso -> filterTable -> new table
// a) JUST LASSO -> if lasso, only filter by lasso

// 3) coloring ->
// a) select metadata to color by
// b) generate color scheme
// c) get color for each ID -> BACKEND
// getProjColors(col, bins, colors) -> [id, col]

export async function calculateHistograms(
	completeColumns,
	filterPredicates,
	model,
	transform,
	metric
) {
	const requestedHistograms = completeColumns.filter(
		(c) =>
			(c.model === "" || c.model === model) &&
			(c.transform === "" || c.transform === transform) &&
			c.columnType !== ZenoColumnType.OUTPUT &&
			c.columnType !== ZenoColumnType.TRANSFORM
	);
	const res = await fetch("/api/calculate-histograms", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			columns: requestedHistograms,
			model,
			transform,
			metric,
			filter_predicates: filterPredicates,
		}),
	}).then((res) => res.json());

	return JSON.parse(res);
}
