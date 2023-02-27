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
export async function createNewSlice(
	sliceName: string,
	predicateGroup: FilterPredicateGroup,
	folder = ""
) {
	await ZenoService.createNewSlice({
		sliceName: sliceName,
		folder,
		filterPredicates: predicateGroup,
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

	if (metricKeys.length > 0) {
		return await ZenoService.getMetricsForSlices({
			metricKeys,
			filterIds,
		});
	}
}
