import { ZenoService, type FilterIds, type GroupMetric } from "../zenoservice";
import {
	ZenoColumnType,
	type FilterPredicate,
	type FilterPredicateGroup,
	type MetricKey,
} from "../zenoservice";

function instanceOfFilterPredicate(object): object is FilterPredicate {
	return "column" in object;
}

function setModelForMetricKey(
	pred: FilterPredicateGroup | FilterPredicate,
	model: string
) {
	if (instanceOfFilterPredicate(pred)) {
		if (pred.column.columnType === ZenoColumnType.POSTDISTILL) {
			pred.column.model = model;
		}
	} else {
		pred.predicates = pred.predicates.map((p) =>
			setModelForMetricKey(p, model)
		);
	}
	return pred;
}

function setModelForMetricKeys(metricKeys: MetricKey[]) {
	return metricKeys.map((key) => {
		if (
			key.sli.filterPredicates &&
			key.sli.filterPredicates.predicates.length > 0
		) {
			key.sli.filterPredicates.predicates.map((pred) =>
				setModelForMetricKey(pred, key.model)
			);
		}
		return key;
	});
}

function setMetricForSize(metricKeys: MetricKey[]) {
	return metricKeys.map((key) => {
		key.metric = key.metric === "size" ? "accuracy" : key.metric;
		return key;
	});
}

export async function deleteSlice(sliceName: string) {
	await ZenoService.deleteSlice([sliceName]);
}

export async function getMetricsForSlices(
	metricKeys: MetricKey[],
	filterIds?: FilterIds
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
	metricKeys = setModelForMetricKeys(metricKeys);

	// use accuracy as default metrics to fetch size metric
	metricKeys = setMetricForSize(metricKeys);

	if (metricKeys.length > 0) {
		return await ZenoService.getMetricsForSlices({
			metricKeys,
			filterIds,
		});
	}
}

export async function getMetricsForSlicesAndTags(
	metricKeys: MetricKey[],
	tagIds?: FilterIds,
	filterIds?: FilterIds,
	tagList?: String[],
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
	metricKeys = setModelForMetricKeys(metricKeys);
	if (metricKeys.length > 0) {
		return await ZenoService.getMetricsForSlicesAndTags({
			metricKeys,
			tagIds,
			filterIds,
			tagList,
		});
	}
}
