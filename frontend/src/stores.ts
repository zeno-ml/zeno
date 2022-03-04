import { derived, writable, type Writable } from "svelte/store";
import websocketStore from "svelte-websocket-store";

export const metrics = writable([] as Metric[]);
export const metric_names = writable([] as string[]);
export const slicers = writable([] as Slicer[]);

export const slices = writable(new Map<string, Slice>());

export const wsResponse: Writable<WSResponse> = websocketStore("ws://localhost:8000/api/results", {"status": "connecting", results: []});
export const status = derived(wsResponse, $wsResponse => $wsResponse.status, "connecting");
export const results = derived(
  wsResponse,
  ($r) => {
    if ($r.results.length > 0) {
      return $r.results;
    } else {
      return []
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