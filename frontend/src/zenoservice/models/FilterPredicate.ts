/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type FilterPredicate = {
	column: ZenoColumn;
	operation: string;
	value: string | number | boolean;
	join?: string;
};
