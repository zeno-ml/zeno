/// <reference types="svelte" />

import type ColumnTable from "arquero/dist/types/table/column-table";

interface Test {
  test: string;
  slice: string;
  metric: number;
  size: number;
  model: string;
}

interface Slicer {
  name: string;
  source: string;
  slices: string[];
}

interface Metric {
  name: string;
  source: string;
}

interface Slice {
  name: string;
  size: number;
  table: ?ColumnTable;
}

interface Result {
  id: int;
  metric: string;
  transform: string;
  slice: string;
  sliceSize: number;
  modelNames: string[];
  modelResults: { property: float }[];
}

interface WSResponse {
  status: string;
  results: Result[];
}
