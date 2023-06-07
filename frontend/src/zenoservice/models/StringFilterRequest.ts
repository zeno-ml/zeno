/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from './ZenoColumn';

export type StringFilterRequest = {
    column: ZenoColumn;
    filterString: string;
    isRegex: boolean;
    caseMatch: boolean;
    wholeWordMatch: boolean;
};
