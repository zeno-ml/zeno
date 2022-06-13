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

interface MetadataSelection {
  name: string;
  type: string;
  values: [];
}

interface FilterPredicate {
  column: string;
  // 'metadata' or 'slice'
  type: string;
  operation: string;
  value: string;
  join: string;
  // 'start' or 'end'
  groupIndicator?: string;
}

interface Slice {
  name: string;
  predicates: FilterPredicate[];
  size: number;
}
