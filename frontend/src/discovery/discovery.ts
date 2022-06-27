import { color as _color } from "d3";
import type { TypedArray } from "arquero/dist/types/table/table";
import type ColumnTable from "arquero/dist/types/table/column-table";

export function interpolateColorToArray(
	interpolateColorer: (normalized: number) => string,
	length: number
) {
	const increment = 1.0 / length;
	let colorArray = new Array(length);
	for (let i = 0, t = 0; i < colorArray.length; i++, t += increment) {
		colorArray[i] = _color(interpolateColorer(t)).hex();
	}
	return colorArray;
}

export async function projectEmbeddings2D(
	model: string,
	instance_ids: any[] | TypedArray = []
) {
	const response = await fetch("api/projection", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ model, instance_ids }),
	});
	const output = await response.json();
	return JSON.parse(output);
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
	return formatted;
}
function formatLegend(colors: string[], labels: string[]) {
	const formatted = labels.map((label, i) => ({
		color: colors[i],
		value: label,
	}));
	return formatted;
}
export const reformatAPI = {
	legendaryScatter: { points: formatScatter, legend: formatLegend },
};
