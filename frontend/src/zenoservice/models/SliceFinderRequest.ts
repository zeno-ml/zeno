/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type SliceFinderRequest = {
	id: string;
	model: string;
	order_by: string;
	minimum_size: string;
	depth: string;
	columns?: Array<ZenoColumn>;
	column_name: string;
};
