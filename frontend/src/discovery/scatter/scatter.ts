import type { Properties } from "regl-scatterplot/dist/types";
import type { HSLColor, RGBColor } from "d3-color";

// row format
export interface ScatterPoint {
	x: number;
	y: number;
	colorIndex: number;
	opacity: number;
}
export type ScatterRows = ScatterPoint[];

//column format
export interface ReglScatterColumns {
	x: number[];
	y: number[];
	category: number[]; //notice color is now category
	value: number[]; // notice opacity is now value
}
export type ReglConfig = Partial<Properties>;
export type ColorRange = string[];

export interface LegendaryScatterPoint {
	x: number;
	y: number;
	color: number;
	opacity: number;
	id?: unknown;
}
export interface LegendaryLegendEntry {
	color: string;
	value: string;
}

export function opacify(colorObj: RGBColor | HSLColor, opacity: number) {
	const colorCopy = colorObj.copy();
	colorCopy.opacity = opacity;
	return colorCopy;
}
