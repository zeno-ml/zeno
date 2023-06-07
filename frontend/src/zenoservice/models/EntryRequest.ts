/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ZenoColumn } from './ZenoColumn';

export type EntryRequest = {
    id: (number | string);
    columns?: Array<ZenoColumn>;
};
