import { websocketStore } from "svelte-websocket-store";
import {
	derived,
	get,
	writable,
	type Readable,
	type Writable,
} from "svelte/store";

import { folderWritable, reportWritable } from "./util/customStores";

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
export const settings: Writable<Settings> = writable(<Settings>{
	view: "",
	idColumn: {},
	dataColumn: {},
	labelColumn: {},
	metadataColumns: [],
	dataOrigin: "",
	samples: 0,
	totalSize: 0,
});
export const metrics: Writable<string[]> = writable([]);
export const models: Writable<string[]> = writable([]);

export const model: Writable<string> = writable(undefined);
export const metric: Writable<string> = writable(undefined);
export const currentColumns: Readable<ZenoColumn[]> = derived(
	[settings, model],
	([$settings, $model]) =>
		$settings.metadataColumns.filter(
			(c) => c.model === "" || c.model === $model
		)
);

// [column, ascending]
export const sort: Writable<[ZenoColumn, boolean]> = writable([
	undefined,
	true,
]);

export const slices: Writable<Map<string, Slice>> = writable(new Map());
export const folders: Writable<string[]> = folderWritable();
export const reports: Writable<Report[]> = reportWritable();

export const filteredTable: Writable<Record<string, unknown>[]> = writable([]);
// slices is an array of slice names,
// metadata is an object where keys are column names and values are FilterPredicateGroups
export const selections: Writable<{
	metadata: Record<string, FilterPredicateGroup>;
	slices: Array<string>;
}> = writable({
	metadata: {},
	slices: [],
});
// the ids directly selected by the user
export const selectionIds: Writable<FilterIds> = writable({ ids: [] });
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
export const report: Writable<number> = writable(undefined);

export const showNewSlice: Writable<boolean> = writable(false);
export const sliceToEdit: Writable<Slice> = writable(null);

export const metricRange: Writable<[number, number]> = writable([
	Infinity,
	-Infinity,
]);
