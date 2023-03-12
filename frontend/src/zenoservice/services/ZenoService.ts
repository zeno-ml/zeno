/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ColorsProjectRequest } from "../models/ColorsProjectRequest";
import type { EmbedProject2DRequest } from "../models/EmbedProject2DRequest";
import type { EntryRequest } from "../models/EntryRequest";
import type { FilterPredicateGroup } from "../models/FilterPredicateGroup";
import type { HistogramBucket } from "../models/HistogramBucket";
import type { HistogramRequest } from "../models/HistogramRequest";
import type { MetricRequest } from "../models/MetricRequest";
import type { MetricReturn } from "../models/MetricReturn";
import type { Points2D } from "../models/Points2D";
import type { PointsColors } from "../models/PointsColors";
import type { Report } from "../models/Report";
import type { Slice } from "../models/Slice";
import type { SliceFinderRequest } from "../models/SliceFinderRequest";
import type { SliceMetric } from "../models/SliceMetric";
import type { StringFilterRequest } from "../models/StringFilterRequest";
import type { TableRequest } from "../models/TableRequest";
import type { ZenoColumn } from "../models/ZenoColumn";
import type { ZenoSettings } from "../models/ZenoSettings";
import type { ZenoVariables } from "../models/ZenoVariables";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class ZenoService {
	/**
	 * Get Settings
	 * @returns ZenoSettings Successful Response
	 * @throws ApiError
	 */
	public static getSettings(): CancelablePromise<ZenoSettings> {
		return __request(OpenAPI, {
			method: "GET",
			url: "/settings",
		});
	}

	/**
	 * Get Initial Info
	 * @returns ZenoVariables Successful Response
	 * @throws ApiError
	 */
	public static getInitialInfo(): CancelablePromise<ZenoVariables> {
		return __request(OpenAPI, {
			method: "GET",
			url: "/initialize",
		});
	}

	/**
	 * Get Slices
	 * @returns Slice Successful Response
	 * @throws ApiError
	 */
	public static getSlices(): CancelablePromise<Record<string, Slice>> {
		return __request(OpenAPI, {
			method: "GET",
			url: "/slices",
		});
	}

	/**
	 * Get Reports
	 * @returns Report Successful Response
	 * @throws ApiError
	 */
	public static getReports(): CancelablePromise<Array<Report>> {
		return __request(OpenAPI, {
			method: "GET",
			url: "/reports",
		});
	}

	/**
	 * Update Reports
	 * @param requestBody
	 * @returns any Successful Response
	 * @throws ApiError
	 */
	public static updateReports(
		requestBody: Array<Report>
	): CancelablePromise<any> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/reports",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Set Folders
	 * @param requestBody
	 * @returns any Successful Response
	 * @throws ApiError
	 */
	public static setFolders(requestBody: Array<string>): CancelablePromise<any> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/folders",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Filtered Ids
	 * @param requestBody
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static getFilteredIds(
		requestBody: FilterPredicateGroup
	): CancelablePromise<string> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/filtered-ids",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Filtered Table
	 * @param requestBody
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static getFilteredTable(
		requestBody: TableRequest
	): CancelablePromise<string> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/filtered-table",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Histogram Buckets
	 * @param requestBody
	 * @returns HistogramBucket Successful Response
	 * @throws ApiError
	 */
	public static getHistogramBuckets(
		requestBody: Array<ZenoColumn>
	): CancelablePromise<Array<Array<HistogramBucket>>> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/histograms",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Calculate Histogram Counts
	 * @param requestBody
	 * @returns number Successful Response
	 * @throws ApiError
	 */
	public static calculateHistogramCounts(
		requestBody: HistogramRequest
	): CancelablePromise<Array<Array<number>>> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/histogram-counts",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Calculate Histogram Metrics
	 * @param requestBody
	 * @returns number Successful Response
	 * @throws ApiError
	 */
	public static calculateHistogramMetrics(
		requestBody: HistogramRequest
	): CancelablePromise<Array<Array<number>>> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/histogram-metrics",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Create New Slice
	 * @param requestBody
	 * @returns any Successful Response
	 * @throws ApiError
	 */
	public static createNewSlice(requestBody: Slice): CancelablePromise<any> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/slice",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Delete Slice
	 * @param requestBody
	 * @returns any Successful Response
	 * @throws ApiError
	 */
	public static deleteSlice(
		requestBody: Array<string>
	): CancelablePromise<any> {
		return __request(OpenAPI, {
			method: "DELETE",
			url: "/slice",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Filter String Metadata
	 * @param requestBody
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static filterStringMetadata(
		requestBody: StringFilterRequest
	): CancelablePromise<Array<string>> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/string-filter",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Metrics For Slices
	 * @param requestBody
	 * @returns SliceMetric Successful Response
	 * @throws ApiError
	 */
	public static getMetricsForSlices(
		requestBody: MetricRequest
	): CancelablePromise<Array<SliceMetric>> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/slice-metrics",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Embed Exists
	 * Checks if embedding exists for a model.
	 * Returns the boolean True or False directly
	 * @param model
	 * @returns boolean Successful Response
	 * @throws ApiError
	 */
	public static embedExists(model: string): CancelablePromise<boolean> {
		return __request(OpenAPI, {
			method: "GET",
			url: "/embed-exists/{model}",
			path: {
				model: model,
			},
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Project Embed Into 2D
	 * @param requestBody
	 * @returns Points2D Successful Response
	 * @throws ApiError
	 */
	public static projectEmbedInto2D(
		requestBody: EmbedProject2DRequest
	): CancelablePromise<Points2D> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/embed-project",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Project Find Available Slices
	 * @param requestBody
	 * @returns MetricReturn Successful Response
	 * @throws ApiError
	 */
	public static projectFindAvailableSlices(
		requestBody: SliceFinderRequest
	): CancelablePromise<MetricReturn> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/slice-finder-project",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Projection Colors
	 * @param requestBody
	 * @returns PointsColors Successful Response
	 * @throws ApiError
	 */
	public static getProjectionColors(
		requestBody: ColorsProjectRequest
	): CancelablePromise<PointsColors> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/colors-project",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}

	/**
	 * Get Df Row Entry
	 * @param requestBody
	 * @returns string Successful Response
	 * @throws ApiError
	 */
	public static getDfRowEntry(
		requestBody: EntryRequest
	): CancelablePromise<string> {
		return __request(OpenAPI, {
			method: "POST",
			url: "/entry",
			body: requestBody,
			mediaType: "application/json",
			errors: {
				422: `Validation Error`,
			},
		});
	}
}
