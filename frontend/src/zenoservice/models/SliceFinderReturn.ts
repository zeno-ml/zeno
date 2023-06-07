/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Slice } from './Slice';

export type SliceFinderReturn = {
    slices: Array<Slice>;
    metrics: Array<number>;
    sizes: Array<number>;
    overallMetric: number;
};
