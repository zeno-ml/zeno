/// <reference types="svelte" />

interface Settings {
  task: string;
  idColumn: string;
  labelColumn: string;
  dataColumn: string;
  metadataColumns: string[];
}

interface WSResponse {
  status: string;
  doneProcessing: boolean;
  completeColumns: string[];
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
  sliceName: string;
  filterPredicates: FilterPredicate[];
  idxs?: string[];
}

interface ReportPredicate {
  sliceName: string;
  metric: string;
  operation: string;
  value: string;
}

interface Report {
  name: string;
  reportPredicates: ReportPredicate[];
}

declare namespace svelte.JSX {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface DOMAttributes<T> {
    onclick_outside?: CompositionEventHandler<T>;
  }
}
