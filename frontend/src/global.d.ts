/// <reference types="svelte" />

interface Settings {
  task: string;
  idColumn: string;
  labelColumn: string;
  metadata: string[];
}

interface WSResponse {
  status: string;
  slices: Slice[];
  columns: string[];
}

interface Slice {
  name: string;
  // One of "programmatic", "generated"
  type: string;
  size: number;
}

interface ResultKey {
  // A JS query string, combination of metadata and slices.
  slice: string;
  metric: string;
  model: string;
}

interface ResultsRequest {
  sli: string;
  idxs: string[];
}
