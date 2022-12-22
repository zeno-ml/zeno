import type createScatterPlot from "regl-scatterplot";
import type { Properties } from "regl-scatterplot/dist/types";

export type ReglScatterObject = ReturnType<typeof createScatterPlot>;

//column format that regl takes in
export interface ReglScatterData {
	x: number[] | Float32Array;
	y: number[] | Float32Array;
	ids?: string[];
	category?: number[]; //notice color is now category
	value?: number[]; // notice opacity is now value
}
export type ReglScatterConfig = Partial<Properties>;
export type ReglScatterColorRange = string[];

export interface ReglScatterPointDispatch {
	index: number;
	canvasX: number;
	canvasY: number;
}
