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

interface FilterPredicateGroup {
	predicates: (FilterPredicate | FilterPredicateGroup)[];
	// '', AND or OR
	join: string;
}

interface FilterPredicate {
	column: ZenoColumn;
	// >, <, ==, !=, >=, <=
	operation: string;
	value: string | boolean | number;
	// '', AND or OR
	join?: string;
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
}

interface Report {
	name: string;
	reportType: string;
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

interface Extent {
	min: number;
	max: number;
}
interface XYExtent {
	xExtent: Extent;
	yExtent: Extent;
}

declare namespace svelte.JSX {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface DOMAttributes<T> {
		onclick_outside?: CompositionEventHandler<T>;
	}
}
