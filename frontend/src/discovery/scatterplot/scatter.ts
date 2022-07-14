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

export function extentXY<T>(
	data: T[],
	xGetter = (d: T) => d[0],
	yGetter = (d: T) => d[1]
) {
	const firstPoint = data[0];
	const xExtent = { min: xGetter(firstPoint), max: xGetter(firstPoint) };
	const yExtent = { min: yGetter(firstPoint), max: yGetter(firstPoint) };
	for (let i = 1; i < data.length; i++) {
		const value = data[i];
		const xValue = xGetter(value),
			yValue = yGetter(value);
		// mins
		if (xValue < xExtent.min) {
			xExtent.min = xValue;
		}
		if (yValue < yExtent.min) {
			yExtent.min = yValue;
		}
		// maxs
		if (xValue > xExtent.max) {
			xExtent.max = xValue;
		}
		if (yValue > yExtent.max) {
			yExtent.max = yValue;
		}
	}
	return { xExtent, yExtent };
}
