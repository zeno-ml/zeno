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
}

interface Result {
  id: int;
  metric: string;
  transform: string;
  slice: string[];
  sliceSize: number;
  modelNames: string[];
  modelResults: { property: float }[];
}

interface WSResponse {
  status: string;
  id_column: string;
  label_column: string;
  results: Result[];
}
