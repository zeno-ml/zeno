import { schemeCategory10, interpolateBuPu } from "d3-scale-chromatic";
import { color } from "d3-color";

export const OTHER_COLOR_SCALE = ["#73726E"];

export const NOMINAL_COLOR_SCALE = schemeCategory10 as string[];

export const BOOLEAN_COLOR_SCALE = ["#FF5733", "#4168E1"];

export const CONTINUOUS_COLOR_SCALE = interpolateToStringArray(
	interpolateBuPu,
	20,
	0.1
);

/**
 * Takes a function that produces colors from numbers into a fixed sized array
 *
 * @returns string array of hex colors
 */
function interpolateToStringArray(
	colorInterpolate: (x: number) => string,
	length: number,
	padLeft = 0,
	padRight = 0
) {
	const colors: string[] = new Array(length);
	const interval = 1 / (length - padLeft - padRight);
	let inputValue = 0 + padLeft;
	for (let i = 0; i < length; i++) {
		// must be a normalized value
		if (inputValue > 1) {
			inputValue = 1;
		} else if (inputValue < 0) {
			inputValue = 0;
		}

		// from continuous function to string hex
		const rgbString = colorInterpolate(inputValue);
		colors[i] = color(rgbString).formatHex();
		inputValue += interval;
	}

	return colors;
}
