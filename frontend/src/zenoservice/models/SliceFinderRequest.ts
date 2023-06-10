/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type SliceFinderRequest = {
	metricColumn: ZenoColumn;
	searchColumnsCont: Array<ZenoColumn>;
	searchColumns: Array<ZenoColumn>;
	orderBy: string;
	alpha: number;
	maxLattice: number;
};
