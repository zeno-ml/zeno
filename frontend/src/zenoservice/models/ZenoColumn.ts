/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MetadataType } from "./MetadataType";
import type { ZenoColumnType } from "./ZenoColumnType";

export type ZenoColumn = {
	columnType: ZenoColumnType;
	name: string;
	metadataType?: MetadataType;
	model?: string;
};
