/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";
import type { FilterPredicateGroup } from "./FilterPredicateGroup";

export type PlotRequest = {
	filterPredicates: FilterPredicateGroup;
	tagIds: FilterIds;
};
