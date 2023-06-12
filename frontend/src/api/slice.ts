import {
	ZenoColumnType,
	ZenoService,
	type FilterIds,
	type FilterPredicate,
	type FilterPredicateGroup,
	type GroupMetric,
	type MetricKey,
} from "../zenoservice";
import { slices } from "../stores";

function instanceOfFilterPredicate(object): object is FilterPredicate {
	return "column" in object;
}

export function setModelForFilterPredicateGroup(
	pred: FilterPredicateGroup | FilterPredicate,
	model: string
) {
	if (instanceOfFilterPredicate(pred)) {
		if (
			pred.column.columnType === ZenoColumnType.POSTDISTILL ||
			pred.column.columnType === ZenoColumnType.OUTPUT
		) {
			pred = {
				...pred,
				column: {
					...pred.column,
					model: model,
				},
			};
		}
	} else {
		return {
			...pred,
			predicates: pred.predicates.map((p) =>
				setModelForFilterPredicateGroup(p, model)
			),
		};
	}
	return pred;
}

function setModelForMetricKeys(metricKeys: MetricKey[]) {
	return metricKeys.map((key) => {
		if (
			key.sli.filterPredicates &&
			key.sli.filterPredicates.predicates.length > 0
		) {
			return {
				...key,
				sli: {
					...key.sli,
					filterPredicates: {
						...key.sli.filterPredicates,
						predicates: key.sli.filterPredicates.predicates.map((pred) => {
							return {
								...pred,
								...setModelForFilterPredicateGroup(pred, key.model),
							};
						}),
					},
				},
			};
		}
		return { ...key };
	});
}

function setMetricForSize(metricKeys: MetricKey[]) {
	return metricKeys.map((key) => {
		key.metric = key.metric === "slice size" ? "" : key.metric;
		return key;
	});
}

export async function deleteSlice(sliceName: string) {
	slices.update((s) => {
		s.delete(sliceName);
		return s;
	});
	await ZenoService.deleteSlice([sliceName]);
}

const metricKeyCache = new Map();
export async function getMetricsForSlices(
	metricKeys: MetricKey[]
): Promise<GroupMetric[]> {
	if (metricKeys.length === 0) {
		return null;
	}
	// update metric to empty string if metric is size
	metricKeys = setMetricForSize(metricKeys);

	if (metricKeys[0].metric === undefined) {
		metricKeys = metricKeys.map((k) => ({ ...k, metric: "" }));
	}
	if (metricKeys[0].model === undefined) {
		metricKeys = metricKeys.map((k) => ({ ...k, model: "" }));
	}
	// Update model in predicates if slices are dependent on postdistill or output columns.
	metricKeys = <MetricKey[]>setModelForMetricKeys(metricKeys);
	// Check if we have already fetched this metric key
	const keysToRequest: MetricKey[] = [];
	const requestIndices = [];
	const results = [];
	for (let i = 0; i < metricKeys.length; i++) {
		const metricKeyHash = JSON.stringify(metricKeys[i]);
		if (metricKeyCache.has(metricKeyHash)) {
			results[i] = metricKeyCache.get(metricKeyHash);
		} else {
			keysToRequest.push(metricKeys[i]);
			requestIndices.push(i);
		}
	}
	if (keysToRequest.length > 0) {
		const res = await ZenoService.getMetricsForSlices({
			metricKeys: keysToRequest,
		});
		keysToRequest.forEach((key, i) => {
			metricKeyCache.set(JSON.stringify(key), res[i]);
			results[requestIndices[i]] = res[i];
		});
	}

	return results;
}

export async function getMetricsForSlicesAndTags(
	metricKeys: MetricKey[],
	tagIds?: FilterIds,
	filterIds?: FilterIds,
	tagList?: string[],
	compare?: boolean
): Promise<GroupMetric[]> {
	if (metricKeys.length === 0) {
		return null;
	}
	if (metricKeys[0].metric === undefined) {
		metricKeys = metricKeys.map((k) => ({ ...k, metric: "" }));
	}
	if (metricKeys[0].model === undefined) {
		metricKeys = metricKeys.map((k) => ({ ...k, model: "" }));
	}
	// Update model in predicates if slices are dependent on postdistill columns.
	if (!compare) {
		metricKeys = <MetricKey[]>setModelForMetricKeys(metricKeys);
	}

	if (metricKeys.length > 0) {
		return await ZenoService.getMetricsForSlicesAndTags({
			metricKeys,
			tagIds,
			filterIds,
			tagList,
		});
	}
}

// check if predicates contain model dependent columns (postdistill or output)
export function doesModelDependOnPredicates(predicates) {
	const isModelDependent = [];
	predicates.forEach((p) => {
		isModelDependent.push(
			p["predicates"]
				? doesModelDependOnPredicates(p["predicates"])
				: p["column"].columnType === ZenoColumnType.POSTDISTILL ||
						p["column"].columnType === ZenoColumnType.OUTPUT
		);
	});
	return isModelDependent.includes(true);
}
