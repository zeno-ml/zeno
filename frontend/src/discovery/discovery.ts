import type ColumnTable from "arquero/dist/types/table/column-table";
import { color } from "d3-color";
import { scaleLinear } from "d3-scale";

interface IInterpolateColor {
	colorer: (normalized: number) => string;
	length: number;
	range?: [number, number];
}

export function interpolateColorToArray({
	colorer,
	length,
	range = [0.0, 1.0],
}: IInterpolateColor) {
	const scale = scaleLinear().domain([0.0, 1.0]).range(range);
	const increment = 1.0 / length;
	const colorArray = new Array(length);
	for (let i = 0, t = 0; i < colorArray.length; i++, t += increment) {
		colorArray[i] = color(colorer(scale(t))).hex();
	}
	return colorArray;
}

export function indexTable(table: ColumnTable, idx: number[]): ColumnTable {
	const selectedTable = table.filter(
		`(d) => op.includes([${idx}], op.row_number(), 0)`
	);
	return selectedTable;
}
