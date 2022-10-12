import { derived, writable, type Readable, type Writable } from "svelte/store";
import { InternMap } from "internmap";
import { websocketStore } from "svelte-websocket-store";
import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";

import {
	folderWritable,
	reportWritable,
	sliceWritable,
} from "./util/customStores";

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
export const folders: Writable<string[]> = folderWritable();

export const model: Writable<string> = writable("");
export const metric: Writable<string> = writable("");
export const transform: Writable<string> = writable("");
export const rowsPerPage = writable(0);

export const report: Writable<number> = writable(undefined);
export const sort: Writable<ZenoColumn> = writable();

export const slices: Writable<Map<string, Slice>> = sliceWritable();
export const reports: Writable<Report[]> = reportWritable();
export const results: Writable<InternMap<MetricKey, number>> = writable(
	new InternMap(
		[],
		(d: MetricKey) =>
			d.sli.sliceName + "." + d.metric + "." + d.model + "." + d.transform
	)
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

export const showNewSlice: Writable<boolean> = writable(false);
export const sliceToEdit: Writable<Slice> = writable(null);

export const metricRange: Writable<[number, number, boolean]> = writable([
	Number.MAX_VALUE,
	Number.MIN_VALUE,
	false,
]);
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
// null when not selected and string[] when we have stuff
export const lassoSelection = writable<string[] | null>(null);
