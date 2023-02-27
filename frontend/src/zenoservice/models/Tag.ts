/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Tag = {
	tagName: string;
	folder: string;
	selectionIds: Array<string>;
};

export type TagMetricKey = {
	tag: Tag;
	model: string;
	metric: string;
}
