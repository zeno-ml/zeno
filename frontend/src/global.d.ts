/// <reference types="svelte" />

interface Settings {
	view: string;
	idColumn: ZenoColumn;
	labelColumn: ZenoColumn;
	dataColumn: ZenoColumn;
	dataOrigin: string;
	metadataColumns: ZenoColumn[];
	samples: number;
	totalSize: number;
}

interface WSResponse {
	status: string;
	doneProcessing: boolean;
	completeColumns: ZenoColumn[];
}

interface MetricKey {
	sli: Slice;
	model: string = "";
	metric: string;
}

interface FilterPredicateGroup {
	predicates: (FilterPredicate | FilterPredicateGroup)[];
	// '', & or |
	join: string;
}

interface FilterPredicate {
	column: ZenoColumn;
	// >, <, ==, !=, >=, <=
	operation: string;
	value: string | boolean | number;
	// '', & or |
	join?: string;
}

interface HistogramEntry {
	bucket: number | string | boolean;
	bucketEnd?: number | string | boolean;
	count?: number;
	filteredCount?: number;
	metric?: number;
}

interface Slice {
	sliceName: string;
	folder: string;
	filterPredicates?: FilterPredicateGroup;
}

interface Result {
	metric: number;
	size: number;
}

interface ReportPredicate {
	sliceName: string;
	metric: string;
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
	// model is only set for OUTPUT columnTypes.
	model?: string;
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

// columnar points
interface Points2D {
	x: Float32Array;
	y: Float32Array;
	ids: string[];
}

declare namespace View {
	type Options = object;
	type SetOptions = (options: Options) => void;
	type Entry = object;

	// component injected into div provided
	type Component = (
		div: HTMLDivElement,
		options: Options,
		entry: Entry,
		modelColumn: string,
		labelColumn: string,
		dataColumn: string,
		dataOrigin: string,
		idColumn: string
	) => void;

	// component injected into div provided
	type OptionsComponent = (div: HTMLDivElement, setOptions: SetOptions) => void;
}

// columnar points
interface Points2D {
	x: number[];
	y: number[];
	ids: string[];
}
