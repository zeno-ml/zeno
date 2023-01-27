import { ZenoColumnType } from "../globals";

function instanceOfFilterPredicate(object): object is FilterPredicate {
	return "column" in object;
}

function setModelForMetricKey(
	pred: FilterPredicate | FilterPredicateGroup,
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
		if (key.sli.filterPredicates) {
			key.sli.filterPredicates = setModelForMetricKey(
				key.sli.filterPredicates,
				key.model
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
	let res = await fetch("/api/slice", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			sliceName: sliceName,
			folder,
			filterPredicates: predicateGroup,
		} as Slice),
	}).then((res) => res.json());

	res = JSON.parse(res);
	return res;
}

export async function deleteSlice(sliceName: string) {
	await fetch("/api/slice", {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify([sliceName]),
	});
}

export async function getMetricsForSlices(
	metricKeys: MetricKey[]
): Promise<SliceMetric[]> {
	if (metricKeys.length === 0 || metricKeys[0].metric === undefined) {
		return null;
	}
	if (metricKeys[0].model === undefined) {
		metricKeys = metricKeys.map((k) => ({ ...k, model: "" }));
	}
	// Update model in predicates if slices are dependent on postdistill columns.
	metricKeys = setModelForMetricKeys(metricKeys);

	if (metricKeys.length > 0) {
		const res = await fetch("/api/slice-metrics", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify(metricKeys),
		}).then((d) => d.json());
		return res;
	}
}
