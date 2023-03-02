/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ChartType } from "./ChartType";
import type { ReportEncoding } from "./ReportEncoding";
import type { ReportPredicate } from "./ReportPredicate";

export type Report = {
	name: string;
	type?: ChartType;
	reportPredicates?: Array<ReportPredicate>;
	xEncoding?: ReportEncoding;
	yEncoding?: ReportEncoding;
	colorEncoding?: ReportEncoding;
};
