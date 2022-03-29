/// <reference types="svelte" />

interface Settings {
  task: string;
  idColumn: string;
  labelColumn: string;
}

interface WSResponse {
  status: string;
  results: Result[];
  slices: Slice[];
}

interface Slice {
  name: string[][];
  size: number;
}

interface ResultRequest {
  slices: string[][];
  metric: string;
  model: string;
  transform: string;
}

interface ResultKey {
  slice: string[string[]];
  transform: string;
  metric: string;
}

interface Result {
  slice: string[string[]];
  transform: string;
  metric: string;
  modelResults?: Map<string, ModelResult>;
}
