import { metric, model, transform } from "./../stores";
import type ColumnTable from "arquero/dist/types/table/column-table";

import * as aq from "arquero";
import {
	interpolateOranges,
	schemeCategory10,
	schemeTableau10,
} from "d3-scale-chromatic";
import { extent } from "d3-array";

import { MetadataType } from "../globals";
import {
	binStartEndFormat,
	combineOutputOneArray,
	interpolateColorToArray,
} from "../util/metadataUtil";
import { metricRange } from "../stores";
import { getMetricsForSlices } from "../util/util";
import { get } from "svelte/store";

export function computeDomain(
	type: MetadataType,
	table: ColumnTable,
	column: string
) {
	switch (type) {
		case MetadataType.NOMINAL:
			return computeCategoricalDomain(table, column);

		case MetadataType.CONTINUOUS:
			const bins = binTable(table, column);
			return {
				domain: combineOutputOneArray(bins.output),
				assignments: bins.assignments,
			};

		case MetadataType.BOOLEAN:
			return computeCategoricalDomain(table, column);

		case MetadataType.DATETIME:
			const dates = table
				.array(column)
				.map((date) => new Date(date))
				.sort((a, b) => a - b);
			return { domain: [dates[0], dates[dates.length - 1]], assignments: [] };

		case MetadataType.OTHER:
			return { domain: [], assignments: [] };

		default:
			return { domain: [], assignments: [] };
	}
}

function computeCategoricalDomain(table: ColumnTable, column: string) {
	const categoryGroups = table.groupby(column);
	const categoryKeys = categoryGroups.groups().keys;
	const categoryData = categoryGroups.count();
	const orderedCategoryData = categoryData.orderby(column);
	const originalCategories = categoryData.array(column);
	const newCategories = orderedCategoryData.array(column);

	// only necessary because the categoryKeys (assignments) need to match the newCategories
	// since those are always ordered the same way (alphabetical)
	// TODO: remove this hack in the future
	const indexToOriginal = new Map();
	const newToIndex = new Map();
	for (let i = 0; i < originalCategories.length; i++) {
		indexToOriginal.set(i, originalCategories[i]);
		newToIndex.set(newCategories[i], i);
	}

	const shiftIndex = (index: number) =>
		newToIndex.get(indexToOriginal.get(index));

	const assignments = [];
	for (let i = 0; i < categoryKeys.length; i++) {
		const correctIndex = shiftIndex(categoryKeys[i]);
		assignments.push(correctIndex);
	}

	const output = {
		binStart: newCategories,
		count: orderedCategoryData.array("count"),
	};

	return { domain: combineOutputOneArray(output), assignments };
}

function binTable(table: ColumnTable, column: string) {
	const binName = `bin_${column}`;
	const countName = "count";

	const binGroups = table.groupby({
		[binName]: aq.bin(column, { maxbins: 20 }),
	});
	const binKeys = binGroups.groups().keys;
	const binnedOutput = binGroups
		.count({ as: countName })
		.impute({ count: () => 0 })
		.orderby(binName);

	const binsNice = binStartEndFormat(binnedOutput.array(binName) as number[]);
	const output = {
		binStart: binsNice.map((bin) => bin.binStart),
		binEnd: binsNice.map((bin) => bin.binEnd),
		count: binnedOutput.array(countName),
	};

	return { output, assignments: binKeys };
}

function countColumn(table, filterQuery) {
	return table.filter(filterQuery).count().object()["count"];
}

export function computeCountsFromDomain(
	table: ColumnTable,
	column: string,
	domain: MetadataCellDomain[],
	type: MetadataType
) {
	if (domain.length === 0) {
		return [];
	}

	if (type === MetadataType.NOMINAL || type === MetadataType.BOOLEAN) {
		return domain.map((d) =>
			countColumn(table, `(d) => d['${column}'] == '${d["binStart"]}'`)
		);
	} else if (type === MetadataType.CONTINUOUS) {
		return domain.map((d) =>
			countColumn(
				table,
				`(d) => d['${column}'] >= ${d["binStart"]} && d['${column}'] < ${d["binEnd"]}`
			)
		);
	} else {
		return [];
	}
}

export function colorDomain(domain: MetadataCellDomain[], type: MetadataType) {
	if (domain.length === 0) {
		return;
	}

	if (type === MetadataType.NOMINAL || type === MetadataType.BOOLEAN) {
		const colors20 = [...schemeTableau10, ...schemeCategory10];
		let colors = colors20.slice(0, domain.length);
		if (domain.length === 2) {
			colors = [schemeTableau10[0], schemeTableau10[2]];
		}
		domain.forEach((d, i) => (d["color"] = colors[i]));
	} else if (type === MetadataType.CONTINUOUS) {
		const numBins = domain.length;
		const colors = interpolateColorToArray(
			interpolateOranges,
			numBins,
			[0.15, 1.0]
		);
		domain.forEach((d, i) => (d["color"] = colors[i]));
	}
}

export async function getColorsByMetric(
	table: ColumnTable,
	hash: string,
	idHash: string,
	domain: MetadataCellDomain[],
	type: MetadataType
) {
	if (domain.length === 0) {
		return;
	}
	const keys = domain.map((d) => {
		let filt = "";
		if (type === MetadataType.NOMINAL || type === MetadataType.BOOLEAN) {
			filt = `(row) => row['${hash}'] == '${d.binStart}'`;
		} else if (type === MetadataType.CONTINUOUS) {
			filt = `(row) => row['${hash}'] >= ${d.binStart} && row['${hash}'] <= ${d.binEnd}`;
		}
		const slice = {
			sliceName: "",
			folder: "",
			idxs: table.filter(filt).array(idHash),
		} as Slice;

		return {
			sli: slice,
			metric: get(metric),
			model: get(model),
			transform: get(transform),
		} as MetricKey;
	});

	const mets = await getMetricsForSlices(keys);
	if (mets) {
		metricRange.update((range) => {
			const r = extent(mets);
			range[0] = r[0] < range[0] ? r[0] : range[0];
			range[1] = r[1] > range[1] ? r[1] : range[1];
			return range;
		});
	}

	return mets ? mets : Array(keys.length).fill(0);
}

export function assignColorsFromDomain(
	table: ColumnTable,
	domain: MetadataCellDomain[],
	assignments: number[],
	idHash: string,
	hash: string,
	type: MetadataType
) {
	if (domain.length === 0) {
		return;
	}

	if (!("color" in domain[0])) {
		colorDomain(domain, type);
	}

	const ids = table.array(idHash);
	const colorLabels = new Array(assignments.length);
	for (let i = 0; i < assignments.length; i++) {
		colorLabels[i] = {
			id: ids[i],
			colorIndex: assignments[i],
		};
	}

	return {
		labels: colorLabels,
		colors: domain.map((d) => d["color"]),
		hash,
	};
}
