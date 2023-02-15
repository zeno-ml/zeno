/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type ZenoSettings = {
	view: string;
	idColumn: ZenoColumn;
	labelColumn: ZenoColumn;
	dataColumn: ZenoColumn;
	dataOrigin: string;
	samples: number;
	calculateHistogramMetrics: boolean;
	inferenceView: boolean;
	totalSize: number;
};
