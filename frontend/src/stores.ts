import { derived, writable, type Readable, type Writable } from "svelte/store";
import { InternMap } from "internmap";
import { websocketStore } from "svelte-websocket-store";
import type ColumnTable from "arquero/dist/types/table/column-table";
import * as aq from "arquero";

export const settings: Writable<Settings> = writable(null);
export const metrics = writable(null);
export const models = writable(null);
export const ready: Writable<boolean> = writable(false);

export const wsResponse: Writable<WSResponse> = websocketStore(
  `ws://localhost:${location.port}/api/results`,
  {
    status: "connecting",
    results: [],
    slices: [],
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

export const slices: Readable<InternMap<string[][], Slice>> = derived(
  wsResponse,
  ($wsResponse) => {
    if ($wsResponse.slices.length > 0) {
      const retMap = new InternMap<string[][], Slice>();
      $wsResponse.slices.forEach((s) => {
        retMap.set(s.name, s);
      });
      return retMap;
    } else {
      return new InternMap<string[][], Slice>();
    }
  }
);

export const table: Writable<ColumnTable> = writable(aq.table({}));

wsResponse.subscribe(() => {
  fetch("/api/table")
    .then((d) => d.json())
    .then((d) => {
      const x = {};
      Object.keys(d).forEach((k) => {
        x[k] = Object.values(d[k]);
      });
      table.set(aq.fromJSON(x));
    });
});
