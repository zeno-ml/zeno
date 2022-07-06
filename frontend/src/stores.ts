import { derived, writable, type Readable, type Writable } from "svelte/store";
import { InternMap } from "internmap";
import { websocketStore } from "svelte-websocket-store";
import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";

export const ready: Writable<boolean> = writable(false);
export const tab: Writable<string> = writable("results");

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

export const settings: Writable<Settings> = writable({
	task: "",
	idColumn: "",
	dataColumn: "",
	labelColumn: "",
	metadataColumns: [],
});
export const metrics: Writable<string[]> = writable([]);
export const models: Writable<string[]> = writable([]);
export const transforms: Writable<string[]> = writable([]);

export const model: Writable<string> = writable("");
export const metric: Writable<string> = writable("");
export const transform: Writable<string> = writable("");

export const report: Writable<number> = writable(undefined);
export const sort: Writable<ZenoColumn> = writable();

export const slices: Writable<Map<string, Slice>> = writable(new Map());
export const reports: Writable<Report[]> = writable([]);
export const results: Writable<InternMap<ResultKey, number>> = writable(
	new InternMap([], (d) => d.slice + "." + d.metric + "." + d.model)
);

export const table: Writable<ColumnTable> = writable(aq.table({}));

export const metadataSelections: Writable<Map<string, MetadataSelection>> =
	writable(new Map());
export const sliceSelections: Writable<string[]> = writable([]);
export const filteredTable: Writable<ColumnTable> = writable(aq.fromJSON({}));

export const currentColumns: Readable<ZenoColumn[]> = derived(
	[settings, model],
	([$settings, $model]) =>
		$settings.metadataColumns.filter(
			(c) => c.model === "" || c.model === $model
		)
);
