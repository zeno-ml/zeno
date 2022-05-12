import { derived, writable, type Readable, type Writable } from "svelte/store";
import { InternMap } from "internmap";
import { websocketStore } from "svelte-websocket-store";
import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";

export const settings: Writable<Settings> = writable({
  task: "",
  idColumn: "",
  labelColumn: "",
  metadata: [],
});
export const metrics = writable([]);
export const models = writable([]);
export const ready: Writable<boolean> = writable(false);

export const wsResponse: Writable<WSResponse> = websocketStore(
  `ws://localhost:${location.port}/api/results`,
  {
    status: "connecting",
    results: [],
    slices: [],
    columns: [],
  } as WSResponse
);

export const status: Readable<string> = derived(
  wsResponse,
  ($wsResponse) => $wsResponse.status,
  "connecting"
);

export const results: Readable<InternMap<ResultKey, Result>> = derived(
  wsResponse,
  ($wsResponse) => {
    if ($wsResponse.results.length > 0) {
      const newMap = new InternMap<ResultKey, Result>([], JSON.stringify);
      $wsResponse.results.forEach((res) => {
        newMap.set(
          {
            slice: res.slice,
            transform: res.transform,
            metric: res.metric,
          },
          res
        );
      });
      return newMap;
    } else {
      return new InternMap<ResultKey, Result>();
    }
  },
  new InternMap<ResultKey, Result>()
);

export const slices: Readable<Map<string, Slice>> = derived(
  wsResponse,
  ($wsResponse) => {
    if ($wsResponse.slices.length > 0) {
      const retMap = new Map<string, Slice>();
      $wsResponse.slices.forEach((s) => {
        retMap.set(s.name, s);
      });
      return retMap;
    } else {
      return new Map<string, Slice>();
    }
  }
);

export const table: Writable<ColumnTable> = writable(aq.table({}));
