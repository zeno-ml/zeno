/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type SliceFinderRequest = {
	metricColumn: ZenoColumn;
	columns: Array<ZenoColumn>;
	orderBy: string;
	minimumSize: number;
	depth: number;
};
