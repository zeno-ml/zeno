import { writable } from "svelte/store";
import websocketStore from "svelte-websocket-store";

export const wsResponse = websocketStore("ws://localhost:8000/api/results", {
  status: "Connecting",
  results: "[]",
} as WSResponse);
// export const results = writable([]);
export const testers = writable([] as Tester[]);
export const slices = writable([] as Slice[]);
export const slicers = writable([] as Slicer[]);
