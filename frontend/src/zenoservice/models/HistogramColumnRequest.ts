/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { HistogramBucket } from './HistogramBucket';
import type { ZenoColumn } from './ZenoColumn';

export type HistogramColumnRequest = {
    column: ZenoColumn;
    buckets: Array<HistogramBucket>;
};
