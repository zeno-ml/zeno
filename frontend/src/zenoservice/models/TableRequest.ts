/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";
import type { FilterPredicateGroup } from "./FilterPredicateGroup";
import type { ZenoColumn } from "./ZenoColumn";

export type TableRequest = {
	columns: Array<ZenoColumn>;
	sliceRange: Array<number>;
	filterPredicates: FilterPredicateGroup;
	sort: Array<any>;
	tagIds: FilterIds;
	filterIds?: FilterIds;
	tagList?: Array<string>;
};
