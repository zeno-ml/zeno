import { table as aqTable } from "arquero";
import { websocketStore } from "svelte-websocket-store";
import { derived, writable, type Readable, type Writable } from "svelte/store";

export const metrics = writable([] as Metric[]);
export const slicers = writable([] as Slicer[]);
export const slices = writable(new Map<string, Slice>());
export const table = writable(aqTable({}));

export const wsResponse: Writable<WSResponse> = websocketStore(
  "ws://localhost:8000/api/results",
  {
    status: "connecting",
    results: [],
    id_column: "",
    label_column: "",
  } as WSResponse
);
export const status = derived(
  wsResponse,
  ($wsResponse) => $wsResponse.status,
  "connecting"
);
export const results: Readable<Result[]> = derived(
  wsResponse,
  ($r) => {
    if ($r.results.length > 0) {
      return $r.results;
    } else {
      return [];
    }
  },
  [] as Result[]
);
export const models = derived(
  results,
  (r: Result[]) => {
    if (r.length > 0) {
      return r[0].modelNames;
    } else {
      return [];
    }
  },
  [] as string[]
);
