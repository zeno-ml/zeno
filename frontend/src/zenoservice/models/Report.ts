/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChartType } from "./ChartType";
import type { Parameters } from "./Parameters";
import type { ReportPredicate } from "./ReportPredicate";
import type { Slice } from "./Slice";

export type Report = {
	name: string;
	type?: ChartType;
	reportPredicates?: Array<ReportPredicate>;
	slices?: Array<Slice>;
	metrics?: Array<string> | string;
	models?: Array<string>;
	parameters?: Parameters;
};
