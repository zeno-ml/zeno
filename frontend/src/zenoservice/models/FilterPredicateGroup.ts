/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterPredicate } from "./FilterPredicate";

export type FilterPredicateGroup = {
	predicates: Array<FilterPredicateGroup | FilterPredicate>;
	join: string;
};
