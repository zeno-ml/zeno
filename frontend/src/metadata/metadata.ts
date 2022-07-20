import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";
import { columnHash } from "../util";

export enum ChartType {
	Count,
	Histogram,
	Binary,
	Other,
}

interface IComputeDomain {
	type: ChartType;
	table: ColumnTable;
	column: string | ZenoColumn;
}
interface ISpecificDomain {
	table: ColumnTable;
	column: string;
}
export function computeDomain({ type, table, column }: IComputeDomain) {
	const hash = typeof column === "string" ? column : columnHash(column);

	let specificDomainFunc: (input: ISpecificDomain) => object[];
	switch (type) {
		case ChartType.Count:
			specificDomainFunc = computeCountDomain;
			break;
		case ChartType.Histogram:
			specificDomainFunc = computeHistogramDomain;
			break;
		case ChartType.Binary:
			specificDomainFunc = computeBinaryDomain;
			break;
		case ChartType.Other:
			specificDomainFunc = computeOtherDomain;
			break;
		default:
			specificDomainFunc = computeOtherDomain;
			break;
	}

	const result = specificDomainFunc({ table, column: hash });
	return result;
}

function computeCategoricalDomain({ table, column }: ISpecificDomain) {
	const categoryGroups = table.groupby(column).count().orderby(column);
	const output = {
		category: categoryGroups.columnArray(column),
		count: categoryGroups.columnArray("count"),
	};
	return combineOutputOneArray(output);
}

function computeCountDomain({ table, column }: ISpecificDomain) {
	const output = computeCategoricalDomain({ table, column });
	return output;
}

function computeBinaryDomain({ table, column }: ISpecificDomain) {
	const output = computeCategoricalDomain({ table, column });
	return output;
}

function computeContinuousBinnedDomain({ table, column }: ISpecificDomain) {
	const output = binTable(table, column);
	return combineOutputOneArray(output);
}

function computeHistogramDomain({ table, column }: ISpecificDomain) {
	const output = computeContinuousBinnedDomain({ table, column });
	return output;
}

function computeOtherDomain({ table, column }: ISpecificDomain) {
	return [];
}

function combineOutputOneArray(obj: object) {
	const key = 0,
		array = 1;
	const entries = Object.entries(obj);
	const length = entries[0][array].length;

	const combinedArray = [];
	for (let i = 0; i < length; i++) {
		const combinedObject = {};
		for (let j = 0; j < entries.length; j++) {
			const entry = entries[j];
			combinedObject[entry[key]] = entry[array][i];
		}
		combinedArray.push(combinedObject);
	}

	return combinedArray;
}

function binStartEndFormat(binsUgly: number[]) {
	const inc = binsUgly[1];
	const formatted = [];
	let i = 0,
		k = 1;
	while (k < binsUgly.length) {
		const binStart = binsUgly[i];
		const binEnd = binsUgly[k];
		formatted.push({ binStart, binEnd });
		i++;
		k++;
	}
	const binStart = binsUgly[i];
	const binEnd = binStart + inc;
	formatted.push({ binStart, binEnd });
	return formatted;
}
function binTable(table: ColumnTable, column: string) {
	const binName = `bin_${column}`;
	const countName = "count";

	const binGroups = table.groupby({
		[binName]: aq.bin(column, { maxbins: 20 }),
	});
	// console.log(binGroups.groups());
	const binnedOutput = binGroups
		.count({ as: countName })
		.impute(
			{ count: () => 0 }
			// {
			// 	expand: {
			// 		[binName]: `(d) => op.sequence(...op.bins(d.${binName}))`,
			// 	},
			// }
		)
		.orderby(binName);

	const binsNice = binStartEndFormat(
		binnedOutput.columnArray(binName) as number[]
	);
	const output = {
		binStart: binsNice.map((bin) => bin.binStart),
		binEnd: binsNice.map((bin) => bin.binEnd),
		count: binnedOutput.columnArray(countName),
	};

	return output;
}

function countColumn({ table, filterQuery }) {
	const count = table.filter(filterQuery).count().object()["count"];
	return count;
}

function countColumnByBin({
	table,
	column,
	binStart,
	binEnd,
}: {
	table: ColumnTable;
	column: string;
	binStart: number;
	binEnd: number;
}) {
	const count = countColumn({
		table,
		filterQuery: `(d) => d['${column}'] >= ${binStart} && d['${column}'] < ${binEnd}`,
	});
	return count;
}

function countColumnByCategory({
	table,
	column,
	category,
}: {
	table: ColumnTable;
	column: string;
	category: string | number;
}) {
	const count = countColumn({
		table,
		filterQuery: `(d) => d['${column}'] == '${category}'`,
	});
	return count;
}

export function countDomainCategorical({
	table,
	domain,
	column,
}: {
	table: ColumnTable;
	domain: object[];
	column: string;
}) {
	const counts = domain.map((d) => {
		return {
			count: countColumnByCategory({ table, column, category: d["category"] }),
		};
	});
	return counts;
}

export function countDomainContinuousBins({
	table,
	domain,
	column,
}: {
	table: ColumnTable;
	domain: object[];
	column: string;
}) {
	const counts = domain.map((d) => {
		return {
			count: countColumnByBin({
				table,
				column,
				binStart: d["binStart"],
				binEnd: d["binEnd"],
			}),
		};
	});
	return counts;
}

export function computeCountsFromDomain({
	table,
	column,
	domain,
}: {
	table: ColumnTable;
	column: string;
	domain: object[];
}) {
	const hash = typeof column === "string" ? column : columnHash(column);
	if (domain.length === 0) {
		return [];
	}

	if ("category" in domain[0]) {
		return countDomainCategorical({ table, domain, column: hash });
	} else if ("binStart" in domain[0]) {
		return countDomainContinuousBins({ table, domain, column: hash });
	} else {
		return [];
	}
}
