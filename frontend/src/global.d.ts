/// <reference types="svelte" />

interface Slicer {
  name: string[];
  source: string;
  slices: string[];
}

interface Metric {
  name: string;
  source: string;
}

interface Slice {
  name: string[];
  size: number;
  id_column: string;
  label_column: string;
  table: ?ColumnTable;
}

interface Result {
  id: int;
  metric: string;
  transform: string;
  slice: string[];
  sliceSize: number;
  modelNames: string[];
  modelIds: int[];
  modelResults: { property: float }[];
}

interface WSResponse {
  status: string;
  results: Result[];
}
