/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";
import type { FilterPredicateGroup } from "./FilterPredicateGroup";
import type { HistogramColumnRequest } from "./HistogramColumnRequest";

export type HistogramRequest = {
	columnRequests: Array<HistogramColumnRequest>;
	filterPredicates?: FilterPredicateGroup;
	model?: string;
	metric?: string;
	tagIds?: FilterIds;
	filterIds?: FilterIds;
};
