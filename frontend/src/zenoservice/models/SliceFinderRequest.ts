/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type SliceFinderRequest = {
	id: string;
	model: string;
	orderBy: string;
	sliceFinderMetric: string;
	minimumSize: string;
	depth: string;
	columns?: Array<ZenoColumn>;
};
