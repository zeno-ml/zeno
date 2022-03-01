import { derived, writable, type Writable } from "svelte/store";
import websocketStore from "svelte-websocket-store";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const wsResponse: Writable<string> = websocketStore("ws://localhost:8000/api/results", "");

export const metrics = writable([] as Metric[]);
export const slices = writable([] as Slice[]);
export const slicers = writable([] as Slicer[]);
export const status = derived(wsResponse, $wsResponse => (JSON.parse($wsResponse) as WSResponse).status);
export const results = derived(
  wsResponse,
  ($r) => {
    const res = JSON.parse($r) as WSResponse;
    if (res.results.length > 0) {
      return res.results;
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
