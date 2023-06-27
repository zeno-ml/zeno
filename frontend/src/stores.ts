import { Prompt } from "./util/demoMetadata";
import { interpolate } from "d3-interpolate";
import {
	derived,
	get,
	writable,
	type Readable,
	type Writable,
} from "svelte/store";
import { folderWritable, reportWritable } from "./util/customStores";
import { websocketStore } from "./util/websocketStore";
import type {
	FilterIds,
	FilterPredicate,
	FilterPredicateGroup,
	Report,
	Slice,
	Tag,
	ZenoColumn,
	ZenoSettings,
} from "./zenoservice";

interface WSResponse {
	status: string;
	doneProcessing: boolean;
	completeColumns: ZenoColumn[];
}

export const tab: Writable<string> = writable("results");

const loc = window.location;
let new_uri;
if (loc.protocol === "https:") {
	new_uri = "wss:";
} else {
	new_uri = "ws:";
}
new_uri += "//" + loc.host;
new_uri += loc.pathname + "api/status";

export const wsResponse = websocketStore(new_uri, "");
export const status: Readable<WSResponse> = derived(
	wsResponse,
	($wsResponse) => {
		try {
			return JSON.parse($wsResponse);
		} catch (e) {
			return {
				status: "connecting",
				doneProcessing: false,
				completeColumns: [],
			} as WSResponse;
		}
	},
	{
		status: "connecting",
		doneProcessing: false,
		completeColumns: [],
	} as WSResponse
);
export const ready: Writable<boolean> = writable(false);

export const rowsPerPage = writable(0);
export const settings: Writable<ZenoSettings> = writable(null);
export const metrics: Writable<string[]> = writable([]);
export const models: Writable<string[]> = writable([]);

export const model: Writable<string> = writable(undefined);
export const metric: Writable<string> = writable(undefined);

export const comparisonModel: Writable<string> = writable(undefined);

// [column, ascending]
export const sort: Writable<[ZenoColumn, boolean]> = writable([
	undefined,
	true,
]);
export const compareSort: Writable<[ZenoColumn | string, boolean]> = writable([
	undefined,
	true,
]);

export const requestingHistogramCounts: Writable<boolean> = writable(false);

export const slices: Writable<Map<string, Slice>> = writable(new Map());
// Slices dependent on models will be separate into two new slices in the comparison tab
// and stored in this writable for model output comparison
export const slicesForComparison: Writable<Map<string, Slice>> = writable(
	new Map()
);
export const folders: Writable<string[]> = folderWritable();
export const tags: Writable<Map<string, Tag>> = writable(new Map());
export const reports: Writable<Report[]> = reportWritable();

// The tag ids selected by the user.
export const tagIds: Writable<FilterIds> = writable({ ids: [] });

// tag name to edit
export const editId: Writable<string> = writable(undefined);

export const editedIds: Writable<string[] | number[]> = writable([]);

// The ids directly selected by the user.
export const selectionIds: Writable<FilterIds> = writable({ ids: [] });
// Slices is an array of slice names,
// metadata is an object where keys are column names and values are FilterPredicateGroups
export const selections: Writable<{
	metadata: Record<string, FilterPredicateGroup>;
	slices: Array<string>;
	tags: Array<string>;
}> = writable({
	metadata: {},
	slices: [],
	tags: [],
});
// Combination of selected filters and slice filters.
// Needs to be a group because we need to join the predicates with &.
export const selectionPredicates: Readable<FilterPredicateGroup> = derived(
	[selections],
	([$selections]) => {
		const predicateGroup: FilterPredicateGroup = { predicates: [], join: "" };
		// Pre-fill slice creation with current metadata selections.
		// Join with AND.
		predicateGroup.predicates = Object.values($selections.metadata)
			.filter((d) => d.predicates.length > 0)
			.flat()
			.map((d, i) => {
				d.join = i === 0 && $selections.slices.length === 0 ? "" : "&";
				return d;
			});

		// if slices are not empty in $selections, add slice filters
		if ($selections.slices.length > 0) {
			let slicesPredicates: (FilterPredicate | FilterPredicateGroup)[] = [];
			$selections.slices.forEach((s, i) => {
				const sli = get(slices).has(s)
					? get(slices).get(s)
					: get(slicesForComparison).get(s);
				const sli_preds = JSON.parse(
					JSON.stringify(sli.filterPredicates.predicates)
				);
				sli_preds[0].join = i === 0 ? "" : "&";
				slicesPredicates = slicesPredicates.concat(sli_preds);
			});
			predicateGroup.predicates = [
				...slicesPredicates,
				...predicateGroup.predicates,
			];
		}
		return predicateGroup;
	}
);
export const report: Writable<number> = writable(undefined);

export const showNewFolder: Writable<boolean> = writable(false);
export const showNewSlice: Writable<boolean> = writable(false);
export const showFixSlice: Writable<boolean> = writable(false);
export const showNewTag: Writable<boolean> = writable(false);
export const sliceToEdit: Writable<Slice> = writable(null);
export const folderToEdit: Writable<string> = writable(null);
export const showSliceFinder: Writable<boolean> = writable(false);

export const metricRange: Writable<[number, number]> = writable([
	Infinity,
	-Infinity,
]);
const colorScale = interpolate("#decbe9", "#6a1b9a");
export const metricRangeColorScale: Readable<(n: number) => string> = derived(
	[metricRange],
	([$metricRange]) => {
		const [min, max] = $metricRange;
		return (n) => {
			if (max - min === 0) {
				return colorScale(0.5);
			}
			return colorScale((n - min) / (max - min));
		};
	}
);

export const scatterColorByColumn: Writable<ZenoColumn> = writable(null);

export const currentPrompt: Writable<Prompt> = writable({
	prompt:
		"You are an agent at the Rivertown Insurance helpdesk that helps with resolving insurance claims.",
	examples: [],
});
