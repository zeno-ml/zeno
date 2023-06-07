/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from './ZenoColumn';

export type ZenoSettings = {
    view: string;
    idColumn: ZenoColumn;
    labelColumn: ZenoColumn;
    dataColumn: ZenoColumn;
    samples: number;
    calculateHistogramMetrics: boolean;
    totalSize: number;
};
