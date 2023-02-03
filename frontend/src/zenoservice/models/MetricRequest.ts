/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from './FilterIds';
import type { MetricKey } from './MetricKey';

export type MetricRequest = {
    metricKeys: Array<MetricKey>;
    filterIds?: FilterIds;
};

