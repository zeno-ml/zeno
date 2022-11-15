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

/**
 * extentXY returns the minimum and maximum values for each dimension X and Y
 */
export function extentXY<T>(
	data: T[],
	xGetter = (d: T) => d[0],
	yGetter = (d: T) => d[1]
): XYExtent {
	const getters = [xGetter, yGetter];
	const extents: Extent[] = extent(data, getters);
	const [xExtent, yExtent] = extents;
	return { xExtent, yExtent };
}

/**
 * extent is a general implementation over n dimensions to get min and max values
 */
function extent<T>(data: T[], getters: ((d: T) => number)[]): Extent[] {
	const extents: Extent[] = getters.map(() => ({
		min: Infinity,
		max: -Infinity,
	}));

	data.forEach((d) => {
		getters.forEach((getter, i) => {
			const value = getter(d);
			const extent = extents[i];
			if (value < extent.min) {
				extent.min = value;
			}
			if (value > extent.max) {
				extent.max = value;
			}
		});
	});
	return extents;
}
