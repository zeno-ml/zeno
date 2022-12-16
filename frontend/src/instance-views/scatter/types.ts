import type { TypedArray } from "d3";
import type createScatterPlot from "regl-scatterplot";
import type { Properties } from "regl-scatterplot/dist/types";

export type ReglScatterplotObj = ReturnType<typeof createScatterPlot>;

//column format that regl takes in
export interface ScatterColumnsFormat {
	x: number[] | TypedArray;
	y: number[] | TypedArray;
	ids?: string[];
	category?: number[]; //notice color is now category
	value?: number[]; // notice opacity is now value
}
export type ReglConfig = Partial<Properties>;
export type ColorRange = string[];
