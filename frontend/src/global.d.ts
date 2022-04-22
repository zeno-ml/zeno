/// <reference types="svelte" />

interface Settings {
  task: string;
  idColumn: string;
  labelColumn: string;
  metadata: string[];
}

interface WSResponse {
  status: string;
  results: Result[];
  slices: Slice[];
  columns: string[];
}

interface Slice {
  name: string;
  // One of "programmatic", "generated"
  type: string;
  size: number;
}

interface ResultRequest {
  // A JS query string, combination of metadata and slices.
  slice_name: string;
  idxs: string[];
  metric: string;
  model: string;
  transform: string;
}

interface ResultKey {
  // A JS query string, combination of metadata and slices.
  slice: string;
  transform: string;
  metric: string;
}

interface Result {
  // A JS query string, combination of metadata and slices.
  slice: string;
  transform: string;
  metric: string;
  modelResults?: Map<string, ModelResult>;
}
