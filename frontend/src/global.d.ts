/// <reference types="svelte" />

interface Settings {
	view: string;
	idColumn: ZenoColumn;
	labelColumn: ZenoColumn;
	dataColumn: ZenoColumn;
	metadataColumns: ZenoColumn[];
	samples: number;
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
	values: Array;
}

interface FilterPredicateGroup {
	predicates: Array<FilterPredicate | FilterPredicateGroup>;
	// '', AND or OR
	join: string;
}

interface FilterPredicate {
	column: ZenoColumn;
	// >, <, ==, !=, >=, <=
	operation: string;
	value: string;
	// '', AND or OR
	join: string;
}

interface Slice {
	sliceName: string;
	folder: string;
	filterPredicates?: FilterPredicateGroup;
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
	metadataType?: MetadataType;
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
