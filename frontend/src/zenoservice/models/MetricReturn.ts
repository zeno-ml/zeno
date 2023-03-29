/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Return type for metric functions.
 *
 * Args:
 * metric (float): Average metric over subset of data
 * variance (float): Variance of metric over subset of data
 */
export type MetricReturn = {
	metric: number;
	variance?: number;
};
