import { ZenoColumnType, type ZenoColumn, type Slice } from "../zenoservice";
import {
	folders,
	metric,
	metrics,
	model,
	models,
	comparisonModel,
	ready,
	reports,
	rowsPerPage,
	settings,
	slices,
	modelDependSlices,
	tab,
	tags,
} from "../stores";
import { ZenoService } from "../zenoservice";
import {
	isModelDependPredicates,
	setModelForFilterPredicateGroup,
} from "../api/slice";

export async function getInitialData() {
	const sets = await ZenoService.getSettings();
	settings.set(sets);
	rowsPerPage.set(sets.samples);

	const inits = await ZenoService.getInitialInfo();
	models.set(inits.models);
	metrics.set(inits.metrics);
	folders.set(inits.folders);

	model.set(
		inits.models.length > 0 ? inits.models[inits.models.length - 1] : ""
	);
	comparisonModel.set(inits.models[0]);
	metric.set(inits.metrics.length > 0 ? inits.metrics[0] : "");

	const slicesRes = await ZenoService.getSlices();
	slices.set(new Map(Object.entries(slicesRes)));

	// initial model dependent slices in compare tab
	const modelSlices = new Map<string, Slice>();
	if (inits.models.length > 0) {
		[inits.models[0], inits.models[inits.models.length - 1]].forEach((mod) => {
			for (const key in slicesRes) {
				const slice = slicesRes[key];
				const preds = slice.filterPredicates.predicates;
				if (isModelDependPredicates(preds)) {
					const newSlice = <Slice>{
						sliceName:
							slice.sliceName +
							"-" +
							(mod === inits.models[0] ? "model B" : "model A"),
						folder: slice.folder,
						filterPredicates: setModelForFilterPredicateGroup(
							slice.filterPredicates,
							mod
						),
					};
					modelSlices[newSlice.sliceName] = newSlice;
				}
			}
		});
	}
	modelDependSlices.set(new Map(Object.entries(modelSlices)));

	const reportsRes = await ZenoService.getReports();
	reports.set(reportsRes);

	const tagsRes = await ZenoService.getTags();
	tags.set(new Map(Object.entries(tagsRes)));

	ready.set(true);
}

export function updateTab(t: string) {
	if (t === "home") {
		window.location.hash = "";
	} else {
		window.location.hash = "#/" + t + "/";
	}
	tab.set(t);
}

export function columnHash(col: ZenoColumn) {
	return (
		(col.columnType === ZenoColumnType.METADATA ? "" : col.columnType) +
		col.name +
		(col.model ? col.model : "")
	);
}

/** Calculate the metric range for coloring histograms */
export function getMetricRange(res: number[][]): [number, number] {
	const range: [number, number] = [Infinity, -Infinity];
	let allNull = true;
	res.forEach((arr) =>
		arr.forEach((n) => {
			if (n !== null) {
				allNull = false;
			}
			range[0] = Math.min(range[0], n);
			range[1] = Math.max(range[1], n);
		})
	);
	if (allNull) {
		return [Infinity, -Infinity];
	}
	return range;
}
