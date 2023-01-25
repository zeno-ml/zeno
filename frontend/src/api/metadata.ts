/**
 * API functions for calculating metadata histograms.
 * We separate them into getting buckets, counts, and metrics so we
 * can run then asynchronously and provide interactive updates while waiting
 * for more expensive computations like calculating metrics.
 */
import { ZenoColumnType } from "../globals";
import { InternMap } from "internmap";
import { metricRange } from "../stores";
import { columnHash, getMetricRange } from "../util/util";
import { get } from "svelte/store";

/**
 * Fetch metadata columns buckets for histograms.
 *
 * @param completeColumns All complete columns.
 * @param model Current model.
 *
 * @returns Histogram buckets for each column.
 */
export async function getHistograms(
	completeColumns: ZenoColumn[],
	model: string
): Promise<InternMap<ZenoColumn, HistogramEntry[]>> {
	const requestedHistograms = completeColumns.filter(
		(c) =>
			(c.model === "" || c.model === model) &&
			c.columnType !== ZenoColumnType.OUTPUT
	);
	const res = await fetch("/api/histograms", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(requestedHistograms),
	}).then((res) => res.json());
	const histograms = new InternMap<string, HistogramEntry[]>(
		requestedHistograms.map((col, i) => [col, res[i]]),
		columnHash
	);
	return histograms;
}

let histogramCountAborter = null;
/**
 * Fetch histogram counts for the buckets of metadata columns.
 *
 * @param histograms Histogram buckets for each column.
 * @param filterPredicates Filter predicates to filter DataFrame by.
 * @returns Histogram counts for each column.
 */
export async function getHistogramCounts(
	histograms: InternMap<ZenoColumn, HistogramEntry[]>,
	filterPredicates: FilterPredicateGroup
): Promise<number[][]> {
	const columnRequests = [...histograms.entries()].map(([k, v]) => ({
		column: k,
		buckets: v,
	}));
	if (histogramCountAborter) {
		histogramCountAborter.abort();
	}
	histogramCountAborter = new AbortController();
	try {
		const res = await fetch("/api/histogram-counts", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				columnRequests,
				filterPredicates,
			}),
			signal: histogramCountAborter.signal,
		}).then((res) => res.json());

		[...histograms.keys()].forEach((k, i) => {
			histograms.set(
				k,
				histograms.get(k).map((h, j) => {
					if (filterPredicates === null) {
						h.count = res[i][j];
					}
					h.filteredCount = res[i][j];
					return h;
				})
			);
		});
		return histograms;
	} catch (e) {
		return undefined;
	}
}

let histogramMetricAborter = null;
/**
 * Fetch histogram metrics for the buckets of metadata columns.
 *
 * @param histograms Histogram buckets for each column.
 * @param filterPredicates Filter predicates to filter DataFrame by.
 * @param model Model to fetch metrics for.
 * @param metric Metric to calculate per bucket.
 * @returns Histogram metrics for each column.
 */
export async function getHistogramMetrics(
	histograms: InternMap<ZenoColumn, HistogramEntry[]>,
	filterPredicates: FilterPredicateGroup,
	model: string,
	metric: string
): Promise<number[][]> {
	if (metric === "" || metric === undefined) {
		return undefined;
	}
	const columnRequests = [...histograms.entries()].map(([k, v]) => ({
		column: k,
		buckets: v,
	}));
	if (histogramMetricAborter) {
		histogramMetricAborter.abort();
	}
	histogramMetricAborter = new AbortController();
	try {
		const res = await fetch("/api/histogram-metrics", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				columnRequests,
				filterPredicates,
				model,
				metric,
			}),
			signal: histogramMetricAborter.signal,
		}).then((res) => res.json());
		if (res === undefined) {
			return undefined;
		}

		if (get(metricRange)[0] === Infinity) {
			metricRange.set(getMetricRange(res));
		}

		[...histograms.keys()].forEach((k, i) => {
			histograms.set(
				k,
				histograms.get(k).map((h, j) => {
					h.metric = res[i][j];
					return h;
				})
			);
		});
		return histograms;
	} catch (e) {
		return undefined;
	}
}
