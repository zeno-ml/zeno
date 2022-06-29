import { derived, writable, type Readable, type Writable } from "svelte/store";
import { InternMap } from "internmap";
import { websocketStore } from "svelte-websocket-store";
import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";

export const settings: Writable<Settings> = writable({
  task: "",
  idColumn: "",
  labelColumn: "",
  metadataColumns: [],
});
export const metrics = writable([]);
export const models = writable([]);
export const ready: Writable<boolean> = writable(false);

export const wsResponse: Writable<WSResponse> = websocketStore(
  `ws://localhost:${location.port}/api/status`,
  {
    status: "connecting",
    doneProcessing: false,
    completeColumns: [],
  } as WSResponse
);
export const status: Readable<string> = derived(
  wsResponse,
  ($wsResponse) => $wsResponse.status,
  "connecting"
);

export const tab: Writable<string> = writable("results");

export const slices: Writable<Map<string, Slice>> = writable(new Map());
export const table: Writable<ColumnTable> = writable(aq.table({}));
export const results: Writable<InternMap<ResultKey, number>> = writable(
  new InternMap([], (d) => d.slice + "." + d.metric + "." + d.model)
);
export const reports: Writable<Report[]> = writable([]);

export const metadataSelections: Writable<Map<string, MetadataSelection>> =
  writable(new Map());
export const sliceSelections: Writable<string[]> = writable([]);

export const report: Writable<number> = writable(undefined);
export const model: Writable<string> = writable("");
export const metric: Writable<string> = writable("");
export const filteredTable: Writable<ColumnTable> = writable(aq.fromJSON({}));
export const currentColumns: Readable<string[]> = derived(
  [settings, model],
  ([$settings, $model]) =>
    $settings.metadataColumns.filter((c) => {
      if (
        c.startsWith("zenopost_") &&
        !c.startsWith("zenopost_" + $model + "_")
      ) {
        return false;
      }
      return true;
    })
);
export const formattedCurrentColumns: Readable<string[]> = derived(
  [currentColumns, model],
  ([$currentColumns, $model]) =>
    $currentColumns.map((c) => {
      if (c.startsWith("zenopre_")) {
        return c.slice(8);
      }
      if (c.startsWith("zenopost_")) {
        return c.slice(10 + $model.length);
      }
      return c;
    })
);
