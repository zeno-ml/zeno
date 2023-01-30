/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ReportPredicate } from "./ReportPredicate";

export type Report = {
	name: string;
	reportType: string;
	reportPredicates: Array<ReportPredicate>;
};
