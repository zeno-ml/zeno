import { derived, writable, type Writable } from "svelte/store";
import websocketStore from "svelte-websocket-store";

export const wsResponse: Writable<WSResponse> = websocketStore("ws://localhost:8000/api/results", {"status": "connecting", results: []});

export const metrics = writable([] as Metric[]);
export const slices = writable([] as Slice[]);
export const slicers = writable([] as Slicer[]);
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
  (r) => {
    if (r.length > 0) {
      return Object.keys(r[0].modelResults);
    } else {
      return [];
    }
  },
  [] as string[]
);
export const metric_names = writable([] as string[]);
