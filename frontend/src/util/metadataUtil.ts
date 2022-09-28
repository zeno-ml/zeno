import { color } from "d3-color";
import { scaleLinear } from "d3-scale";

export function interpolateColorToArray(
	colorer: (normalized: number) => string,
	length: number,
	range: number[] = [0.0, 1.0]
) {
	const scale = scaleLinear().domain([0.0, 1.0]).range(range);
	const increment = 1.0 / length;
	const colorArray = new Array(length);
	for (let i = 0, t = 0; i < colorArray.length; i++, t += increment) {
		colorArray[i] = color(colorer(scale(t))).hex();
	}
	return colorArray;
}
export function combineOutputOneArray(obj: object) {
	const key = 0,
		array = 1;
	const entries = Object.entries(obj);
	const length = entries[0][array].length;

	const combinedArray = [];
	for (let i = 0; i < length; i++) {
		const combinedObject = {};
		for (let j = 0; j < entries.length; j++) {
			const entry = entries[j];
			combinedObject[entry[key]] = entry[array][i];
		}
		combinedArray.push(combinedObject);
	}

	return combinedArray;
}

export function binStartEndFormat(binsUgly: number[]) {
	const inc = binsUgly[1];
	const formatted = [];
	let i = 0,
		k = 1;
	while (k < binsUgly.length) {
		const binStart = binsUgly[i];
		const binEnd = binsUgly[k];
		formatted.push({ binStart, binEnd });
		i++;
		k++;
	}
	const binStart = binsUgly[i];
	const binEnd = binStart + inc;
	formatted.push({ binStart, binEnd });
	return formatted;
}
