/// <reference types="svelte" />

interface Settings {
  task: string;
  idColumn: string;
  labelColumn: string;
  metadata: string[];
}

interface WSResponse {
  status: string;
  doneProcessing: boolean;
  columns: string[];
}

interface ResultKey {
  // A JS query string, combination of metadata and slices.
  slice: string;
  metric: string;
  model: string;
}

interface MetadataSelection {
  name: string;
  type: string;
  values: Array;
}

interface FilterPredicate {
  name: string;
  // 'metadata' or 'slice'
  predicateType: string;
  operation: string;
  value: string;
  join: string;
  // 'start' or 'end'
  groupIndicator?: string;
}

interface Slice {
  name: string;
  predicates: FilterPredicate[];
  idxs?: string[];
}
