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
  testerName: string;
  sliceName: string;
  sliceSize: number;
  modelResults: any[];
}

interface WSResponse {
  status: string;
  results: string;
}
