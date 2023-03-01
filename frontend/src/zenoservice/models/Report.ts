/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ReportPredicate } from "./ReportPredicate";
import type { ReportType } from "./ReportType";
import type { ReportEncoding } from "./ReportEncoding";

export type Report = {
	name: string;
	reportType: ReportType;
	reportPredicates: Array<ReportPredicate>;
	x_encoding: ReportEncoding;
	y_encoding: ReportEncoding;
	color_encoding: ReportEncoding;
};
