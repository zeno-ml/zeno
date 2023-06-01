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

	model.set(inits.models.length > 0 ? inits.models[0] : "");
	comparisonModel.set(inits.models[1]);
	metric.set(inits.metrics.length > 0 ? inits.metrics[0] : "");

	const slicesRes = await ZenoService.getSlices();
	const slicesMap = new Map(Object.entries(slicesRes));
	slices.set(slicesMap);

	// initial model dependent slices in compare tab
	modelDependSlices.set(new Map<string, Slice>());
	updateModelDependentSlices("model A", inits.models[0], slicesMap);
	updateModelDependentSlices("model B", inits.models[1], slicesMap);

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

// update model dependent slices in compare tab
export function updateModelDependentSlices(name, mod, slis) {
	slis.forEach((sli) => {
		const preds = sli.filterPredicates.predicates;
		if (isModelDependPredicates(preds)) {
			modelDependSlices.update((ms) => {
				ms.set(sli.sliceName + "-" + name, <Slice>{
					sliceName: sli.sliceName + "-" + name,
					folder: sli.folder,
					filterPredicates: setModelForFilterPredicateGroup(
						sli.filterPredicates,
						mod
					),
				});
				return ms;
			});
		}
	});
}
