import type { TypedArray } from "arquero/dist/types/table/table";
import type ColumnTable from "arquero/dist/types/table/column-table";
import { color } from "d3-color";
import { post } from "../util";

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

export function indexTable(table: ColumnTable, idx: number[]): ColumnTable {
	const selectedTable = table.filter(
		`(d) => op.includes([${idx}], op.row_number(), 0)`
	);
	return selectedTable;
}
