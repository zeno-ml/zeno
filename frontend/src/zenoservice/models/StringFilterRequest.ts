/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from "./ZenoColumn";

export type StringFilterRequest = {
	column: ZenoColumn;
	filterString: string;
	selectionType: string;
	caseMatch: boolean;
	wholeWordMatch: boolean;
};
