import type ColumnTable from "arquero/dist/types/table/column-table";
import { color } from "d3-color";

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

export function indexTable(table: ColumnTable, idx: number[]): ColumnTable {
	const selectedTable = table.filter(
		`(d) => op.includes([${idx}], op.row_number(), 0)`
	);
	return selectedTable;
}
