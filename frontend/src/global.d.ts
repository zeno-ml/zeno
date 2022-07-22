/// <reference types="svelte" />

interface Settings {
	view: string;
	idColumn: ZenoColumn;
	labelColumn: ZenoColumn;
	dataColumn: ZenoColumn;
	metadataColumns: ZenoColumn[];
}

interface WSResponse {
	status: string;
	doneProcessing: boolean;
	completeColumns: ZenoColumn[];
}

interface MetricKey {
	sli: Slice;
	metric: string;
	model: string;
	transform: string;
}

interface MetadataSelection {
	column: ZenoColumn;
	type: string;
	values: Array;
}

interface FilterPredicate {
	column: ZenoColumn;
	// >, <, ==, !=, >=, <=
	operation: string;
	value: string;
	join: string;
	// 'start' or 'end'
	groupIndicator?: string;
}

interface Slice {
	sliceName: string;
	folder: string;
	filterPredicates?: FilterPredicate[];
	idxs?: string[];
}

interface ReportPredicate {
	sliceName: string;
	metric: string;
	transform: string;
	operation: string;
	value: string;
	// -1, 0, 1
	results: number[];
}

interface Report {
	name: string;
	reportPredicates: ReportPredicate[];
}

interface ZenoColumn {
	columnType: ZenoColumnType;
	name: string;
	// model and transform are only set for OUTPUT columnTypes.
	model?: string;
	transform?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Pipeline {
	export type Projection = { proj: [number, number]; id: string };
	export interface State {
		projection: Projection[];
	}
	export interface Node {
		state: Partial<State>;
		type: string;
		id: string;
	}
}

declare namespace svelte.JSX {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface DOMAttributes<T> {
		onclick_outside?: CompositionEventHandler<T>;
	}
}
