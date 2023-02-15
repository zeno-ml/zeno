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

// [column, ascending]
export const sort: Writable<[ZenoColumn, boolean]> = writable([
	undefined,
	true,
]);

export const requestingHistogramCounts: Writable<boolean> = writable(false);

export const slices: Writable<Map<string, Slice>> = writable(new Map());
export const folders: Writable<string[]> = folderWritable();
export const tags: Writable<Map<string, Tag>> = writable(new Map());
export const reports: Writable<Report[]> = reportWritable();

export const filteredTable: Writable<Record<string, unknown>[]> = writable([]);
// the ids directly selected by the user
export const selectionIds: Writable<FilterIds> = writable({ ids: [] });
// slices is an array of slice names,
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
		let ret: (FilterPredicate | FilterPredicateGroup)[] = Array.from(
			Object.values($selections.metadata)
		)
			.filter((d) => d.predicates.length !== 0)
			.map((d, i) => ({
				predicates: d.predicates,
				join: i === 0 ? "" : "&",
			}))
			.flat();
		if ($selections.slices.length !== 0) {
			ret = [
				...ret,
				...$selections.slices.map((sliName, i) => ({
					predicates: get(slices).get(sliName).filterPredicates.predicates,
					join: i === 0 && ret.length === 0 ? "" : "&",
				})),
			];
		}
		return { predicates: ret, join: "" };
	}
);
export const report: Writable<number> = writable(undefined);

export const showNewFolder: Writable<boolean> = writable(false);
export const showNewSlice: Writable<boolean> = writable(false);
export const sliceToEdit: Writable<Slice> = writable(null);

export const metricRange: Writable<[number, number]> = writable([
	Infinity,
	-Infinity,
]);
const colorScale = interpolate("#decbe9", "#6a1b9a");
export const metricRangeColorScale: Readable<(n: number) => string> = derived(
	[metricRange],
	([$metricRange]) => {
		const [min, max] = $metricRange;
		return (n) => colorScale((n - min) / (max - min));
	}
);

export const scatterColorByColumn: Writable<ZenoColumn> = writable(null);
