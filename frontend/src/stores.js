import { writable } from "svelte/store";
import websocketStore from "svelte-websocket-store";

export const results = websocketStore("ws://localhost:8000/api/results", {
  status: "ready",
  data: [],
});
// export const results = writable([]);
export const tests = writable([]);
export const slices = writable([]);
export const slicers = writable({});
