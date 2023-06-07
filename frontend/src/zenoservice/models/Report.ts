/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChartType } from "./ChartType";
import type { Parameters } from "./Parameters";

export type Report = {
	name: string;
	type?: ChartType;
	slices?: Array<string>;
	metrics?: Array<string>;
	models?: Array<string>;
	parameters?: Parameters;
};
