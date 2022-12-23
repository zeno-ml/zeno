import { scaleLinear, type ScaleLinear } from "d3-scale";
import { extent } from "d3-array";
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

export interface WebGLExtentScalers {
	x: ScaleLinear<number, number>;
	y: ScaleLinear<number, number>;
	scale: (points: Points2D) => void;
}

export const WEBGL_EXTENT = [-1, 1];

/**
 * Create scale for points between [-1, 1] for WebGL canvas
 * ReglScatterplot expects this range
 *
 * scaler function changes points by memory reference
 */
export function createScalesWebgGLExtent(points: Points2D) {
	const xExtent = extent(points.x);
	const yExtent = extent(points.y);

	const xScaler = scaleLinear().domain(xExtent).range(WEBGL_EXTENT);
	const yScaler = scaleLinear().domain(yExtent).range(WEBGL_EXTENT);

	function scale(points: Points2D) {
		for (let i = 0; i < points.x.length; i++) {
			points.x[i] = xScaler(points.x[i]);
			points.y[i] = yScaler(points.y[i]);
		}
	}

	return { x: xScaler, y: yScaler, scale };
}
