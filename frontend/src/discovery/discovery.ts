import type { TypedArray } from "arquero/dist/types/table/table";
import type ColumnTable from "arquero/dist/types/table/column-table";
import type {
	LegendaryLegendEntry,
	LegendaryScatterPoint,
} from "./scatter/scatter";
import { color } from "d3-color";
import { extent } from "d3-array";

export function interpolateColorToArray(
	interpolateColorer: (normalized: number) => string,
	length: number
) {
	const increment = 1.0 / length;
	const colorArray = new Array(length);
	for (let i = 0, t = 0; i < colorArray.length; i++, t += increment) {
		colorArray[i] = color(interpolateColorer(t)).hex();
	}
	return colorArray;
}

export async function post({ url, payload }: { url: string; payload: object }) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});
	const output = await response.json();
	return JSON.parse(output);
}
export async function projectEmbeddings2D(
	model: string,
	instance_ids: unknown[] | TypedArray
) {
	const output = await post({
		url: "api/projection",
		payload: { model, instance_ids },
	});
	return output;
}

export const hasColumn = (dt: ColumnTable, colName: string) =>
	dt._names.includes(colName);

export const cifar10Labels = [
	"airplane",
	"automobile",
	"bird",
	"cat",
	"deer",
	"dog",
	"frog",
	"horse",
	"ship",
	"truck",
];

function formatScatter(
	projection2D: number[][],
	colorValues: number[] | number,
	opacityValues: number[] | number
) {
	const opacityIsArray = Array.isArray(opacityValues);
	const colorIsArray = Array.isArray(colorValues);
	const formatted = projection2D.map((proj, i) => {
		const color = colorIsArray ? colorValues[i] : colorValues;
		const opacity = opacityIsArray ? opacityValues[i] : opacityValues;
		const x = proj[0],
			y = proj[1];
		return {
			x,
			y,
			color,
			opacity,
		};
	});
	return formatted as LegendaryScatterPoint[];
}
function formatLegend(colors: string[], labels: string[]) {
	const formatted = labels.map((label, i) => ({
		color: colors[i],
		value: label,
	}));
	return formatted as LegendaryLegendEntry[];
}
export const reformatAPI = {
	legendaryScatter: { points: formatScatter, legend: formatLegend },
};

export function indexTable(table: ColumnTable, idx: number[]): ColumnTable {
	const selectedTable = table.filter(
		`(d) => op.includes([${idx}], op.row_number(), 0)`
	);
	return selectedTable;
}

export function getBins(values: unknown[], bins = 10) {
	const [minValue, maxValue] = extent(values, (d) => Number(d));
	const range = maxValue - minValue;
	const binInterval = range / bins;
	const binsArray = new Array(bins)
		.fill(0)
		.map((_, i) => minValue + i * binInterval);
	return binsArray;
}
export function binContinuous(values: unknown[], bins = 10) {
	if (bins <= 0) {
		return;
	}
	const binsArray = getBins(values, bins);
	const assignments = [];
	valueIterator: for (let i = 0; i < values.length; i++) {
		const value = values[i];
		binIterator: for (
			let j = 0, k = 1;
			j < binsArray.length && k < binsArray.length - 1;
			j++, k++
		) {
			const withinBin = value >= binsArray[j] && value <= binsArray[k];
			if (withinBin) {
				assignments.push(j);
				break binIterator;
			}
		}
	}
	return assignments;
}

export type dataType = "categorical" | "continuous" | undefined;
export function getDataRange<T>(arrayOfValues: T[], categoryThreshold = 10) {
	const rangeMap = new Map();
	let dataType: dataType = "categorical";
	for (const value of arrayOfValues) {
		if (!rangeMap.has(value)) {
			rangeMap.set(value, 0);
		}
		if (rangeMap.size > categoryThreshold) {
			dataType = "continuous";
			break;
		}
	}

	let outputRange = [];
	if (dataType === "categorical") {
		const categories = [];
		for (const category of rangeMap.keys()) {
			categories.push(category);
		}
		outputRange = categories;
	} else if (dataType === "continuous") {
		const continuous = new Array(10).fill(0).map((_, i) => (i + 1) / 10);
		outputRange = continuous;
	}

	const stringifiedRange = outputRange.map((r) => ({
		value: r,
		str: `${r}`,
	}));
	const orderedRange = stringifiedRange
		.sort((a, b) => a.str.toString().localeCompare(b.str.toString()))
		.map(({ value }) => value); // dirty hack to keep the stuff in the same order

	return { range: orderedRange, type: dataType };
}
