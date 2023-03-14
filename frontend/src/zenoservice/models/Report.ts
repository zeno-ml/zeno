/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChartType } from "./ChartType";
import type { Parameters } from "./Parameters";
import type { Slice } from "./Slice";

export type Report = {
	name: string;
	type?: ChartType;
	slices?: Array<Slice>;
	metrics?: Array<string> | string;
	models?: Array<string>;
	parameters?: Parameters;
};
