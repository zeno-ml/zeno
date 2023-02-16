<script lang="ts">
	import type { HistogramEntry } from "../../api/metadata";
	import { selections } from "../../stores";
	import { columnHash } from "../../util/util";
	import {
		MetadataType,
		ZenoColumnType,
		type FilterPredicate,
		type FilterPredicateGroup,
		type ZenoColumn,
	} from "../../zenoservice";
	import BinaryMetadataCell from "./metadata-cells/BinaryMetadataCell.svelte";
	import ContinuousMetadataCell from "./metadata-cells/ContinuousMetadataCell.svelte";
	import NominalMetadataCell from "./metadata-cells/NominalMetadataCell.svelte";
	import TextMetadataCell from "./metadata-cells/TextMetadataCell.svelte";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];

	const columnMap = {
		[MetadataType.NOMINAL]: NominalMetadataCell,
		[MetadataType.CONTINUOUS]: ContinuousMetadataCell,
		[MetadataType.BOOLEAN]: BinaryMetadataCell,
		[MetadataType.DATETIME]: TextMetadataCell,
		[MetadataType.OTHER]: TextMetadataCell,
	};

	let filterPredicates: FilterPredicateGroup;
	$: filterPredicates = $selections.metadata[columnHash(col)]
		? $selections.metadata[columnHash(col)]
		: { predicates: [], join: "" };
	let predicates: FilterPredicate[] = [];
	$: predicates = filterPredicates.predicates as FilterPredicate[];

	function updatePredicates(predicates: FilterPredicate[]) {
		selections.update((mets) => ({
			slices: mets.slices,
			metadata: {
				...mets.metadata,
				[columnHash(col)]: { predicates, join: "" },
			},
		}));
	}
</script>

{#if histogram}
	<div class="cell">
		<div class="info">
			<div class="label top-text">
				<span>
					{col.columnType === ZenoColumnType.OUTPUT ? "output" : col.name}
				</span>
			</div>
		</div>

		<svelte:component
			this={columnMap[col.metadataType]}
			filterPredicates={predicates}
			{updatePredicates}
			{col}
			{histogram} />
	</div>
{/if}

<style>
	.cell {
		border-top: 0.5px solid #ebebea;
		border-bottom: 0.5px solid #ebebea;
		padding: 10px 0px 10px 0px;
		display: flex;
		flex-direction: column;
	}
	.info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-left: 5px;
		margin-bottom: 10px;
		color: var(--G2);
	}
</style>
