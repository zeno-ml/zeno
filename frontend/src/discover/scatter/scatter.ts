import type createScatterPlot from "regl-scatterplot";
import type { Properties } from "regl-scatterplot/dist/types";
import type { HSLColor, RGBColor } from "d3-color";

export type ReglScatterplot = ReturnType<typeof createScatterPlot>;

export interface ScatterRow {
	x: number;
	y: number;
	colorIndex: number;
	opacity: number;
	id?: string;
}
// row format that user provides
export type ScatterRowsFormat = ScatterRow[];

//column format that regl takes in
export interface ScatterColumnsFormat {
	x: number[];
	y: number[];
	category: number[]; //notice color is now category
	value: number[]; // notice opacity is now value
}
export type ReglConfig = Partial<Properties>;
export type ColorRange = string[];

export function opacify(colorObj: RGBColor | HSLColor, opacity: number) {
	const colorCopy = colorObj.copy();
	colorCopy.opacity = opacity;
	return colorCopy;
}

export function lassoEmpty<T>(selection: T[]) {
	return selection.length === 0;
}
