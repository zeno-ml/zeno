import { InternMap } from "internmap";
import {
	derived,
	get,
	writable,
	type Readable,
	type Writable,
} from "svelte/store";
import { websocketStore } from "svelte-websocket-store";

import { folderWritable, reportWritable } from "./util/customStores";

export const tab: Writable<string> = writable("results");
export const rowsPerPage = writable(0);

export const wsResponse = websocketStore(
	`ws://localhost:${location.port}/api/status`,
	""
);
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

export const settings: Writable<Settings> = writable(<Settings>{
	view: "",
	idColumn: {},
	dataColumn: {},
	labelColumn: {},
	metadataColumns: [],
});
export const metrics: Writable<string[]> = writable([]);
export const models: Writable<string[]> = writable([]);
export const transforms: Writable<string[]> = writable([]);

export const model: Writable<string> = writable(undefined);
export const metric: Writable<string> = writable(undefined);
export const transform: Writable<string> = writable(undefined);
export const zenoState: Readable<ZenoState> = derived(
	[model, metric, transform],
	([$model, $metric, $transform]) => ({
		model: $model,
		metric: $metric,
		transform: $transform,
	})
);
export const currentColumns: Readable<ZenoColumn[]> = derived(
	[settings, model],
	([$settings, $model]) =>
		$settings.metadataColumns.filter(
			(c) => c.model === "" || c.model === $model
		)
);

export const report: Writable<number> = writable(undefined);
export const sort: Writable<ZenoColumn> = writable();

export const slices: Writable<Map<string, Slice>> = writable(new Map());
export const folders: Writable<string[]> = folderWritable();
export const reports: Writable<Report[]> = reportWritable();
export const results: Writable<InternMap<MetricKey, number>> = writable(
	new InternMap(
		[],
		(d: MetricKey) =>
			d.sli.sliceName +
			"." +
			d.state.metric +
			"." +
			d.state.model +
			"." +
			d.state.transform
	)
);

export const filteredTable: Writable<Record<string, any>[]> = writable([]);
// slices is an array of slice names,
// metadata is an object where keys are column names and values are FilterPredicateGroups
export const selections: Writable<{
	metadata: Record<string, FilterPredicateGroup>;
	slices: Array<string>;
}> = writable({
	metadata: {},
	slices: [],
});
export const selectionPredicates: Readable<FilterPredicateGroup[]> = derived(
	[selections],
	([$selections]) => {
		const ret = [
			...Object.values($selections.metadata).filter(
				(d) => d.predicates.length !== 0
			),
		];
		if ($selections.slices.length !== 0) {
			ret.push({
				join: "&",
				predicates: $selections.slices.map(
					(sliName) => get(slices).get(sliName).filterPredicates
				),
			});
		}
		return ret;
	}
);

export const showNewSlice: Writable<boolean> = writable(false);
export const sliceToEdit: Writable<Slice> = writable(null);

// Which metadata column to color projection by.
export const colorByHash = writable("0label");
export const availableColors = writable({});
export const colorSpec = derived(
	[colorByHash, availableColors],
	([$colorByHash, $availableColors]) => {
		const color = $availableColors[$colorByHash];
		return color;
	}
);

export const metricRange: Writable<[number, number, boolean]> = writable([
	Infinity,
	-Infinity,
	false,
]);

// null when not selected and string[] when we have stuff
export const lassoSelection = writable<string[]>([]);
export const startingPointIds = writable<string[]>([]);
