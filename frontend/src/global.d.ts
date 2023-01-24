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

interface ZenoState {
	model: string;
	metric: string;
}

interface MetricKey {
	sli: Slice;
	state: ZenoState;
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

interface Slice {
	sliceName: string;
	folder: string;
	filterPredicates?: FilterPredicateGroup;
}

/**
 * probably a better way to make this a FilterPredicate
 * for the id metadata value \(o_o)/ who knows
 *
 * Made an interface because might add more properties later
 */
interface FilterIds {
	ids: string[];
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
