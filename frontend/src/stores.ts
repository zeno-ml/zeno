import { writable } from "svelte/store";
//@ts-ignore
import websocketStore from "svelte-websocket-store";

export const wsResponse = websocketStore("ws://localhost:8000/api/results", {
  status: "Connecting",
  results: "[]",
} as WSResponse);

export const metrics = writable([] as Tester[]);
export const slices = writable([] as Slice[]);
export const slicers = writable([] as Slicer[]);
export const results = writable([] as Result[]);
export const models = writable([] as string[]);
export const metric_names = writable([] as string[]);
