/// <reference types="svelte" />

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

interface Tester {
  name: string;
  source: string;
}

interface Slice {
  name: string;
  size: number;
}

interface Result {
  id: int;
  metric: string;
  transform: string;
  slice: string;
  sliceSize: number;
  modelResults: { property: float }[];
}

interface WSResponse {
  status: string;
  results: string;
}
