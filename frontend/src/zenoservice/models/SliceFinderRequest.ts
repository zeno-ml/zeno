/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";
import type { FilterPredicateGroup } from "./FilterPredicateGroup";
import type { ZenoColumn } from "./ZenoColumn";

export type SliceFinderRequest = {
	metricColumn: ZenoColumn;
	searchColumns: Array<ZenoColumn>;
	orderBy: string;
	alpha: number;
	maxLattice: number;
	compareColumn?: ZenoColumn;
	filterPredicates?: FilterPredicateGroup;
	tagIds?: FilterIds;
	filterIds?: FilterIds;
	tagList?: Array<string>;
};
