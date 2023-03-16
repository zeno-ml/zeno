/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FilterIds } from "./FilterIds";

export type Tag = {
	tagName: string;
	folder: string;
	selectionIds: FilterIds;
};

export type TagMetricKey = {
	tag: Tag;
	model: string;
	metric: string;
};
