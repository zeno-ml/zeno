/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";
import type { FilterPredicate } from "./FilterPredicate";
import type { FilterPredicateGroup } from "./FilterPredicateGroup";
import type { ZenoColumn } from "./ZenoColumn";

export type TableRequest = {
	columns: Array<ZenoColumn>;
	sliceRange: Array<number>;
	filterPredicates: Array<FilterPredicate | FilterPredicateGroup>;
	sort: Array<any>;
	filterIds?: FilterIds;
};
