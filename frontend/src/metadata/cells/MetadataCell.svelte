<script lang="ts">
	import BinaryMetadataCell from "./metadata-cells/BinaryMetadataCell.svelte";
	import NominalMetadataCell from "./metadata-cells/NominalMetadataCell.svelte";
	import ContinuousMetadataCell from "./metadata-cells/ContinuousMetadataCell.svelte";
	import DateMetadataCell from "./metadata-cells/DateMetadataCell.svelte";
	import TextMetadataCell from "./metadata-cells/TextMetadataCell.svelte";

	import { MetadataType } from "../../globals";
	import { selections } from "../../stores";
	import { columnHash } from "../../util/util";

	export let col: ZenoColumn;
	export let histogram: HistogramEntry[];

	const columnMap = {
		[MetadataType.NOMINAL]: NominalMetadataCell,
		[MetadataType.CONTINUOUS]: ContinuousMetadataCell,
		[MetadataType.BOOLEAN]: BinaryMetadataCell,
		[MetadataType.DATETIME]: DateMetadataCell,
		[MetadataType.OTHER]: TextMetadataCell,
	};

	let filterPredicates: FilterPredicateGroup;
	$: filterPredicates = $selections.metadata[columnHash(col)]
		? $selections.metadata[columnHash(col)]
		: { predicates: [], join: "&" };

	function updatePredicates(predicates: FilterPredicate[]) {
		selections.update((mets) => ({
			slices: mets.slices,
			metadata: {
				...mets.metadata,
				[columnHash(col)]: { predicates, join: "&" },
			},
		}));
	}
</script>

{#if histogram && histogram.length > 0 && histogram[0].count !== null}
	<div class="cell">
		<div class="info">
			<div class="label top-text">
				<span>
					{col.name}
				</span>
			</div>
		</div>
		<svelte:component
			this={columnMap[col.metadataType]}
			filterPredicates={filterPredicates.predicates}
			{updatePredicates}
			{col}
			{histogram} />
	</div>
{/if}

<style>
	.cell {
		border-top: 1px solid #e0e0e0;
		border-bottom: 1px solid #e0e0e0;
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
		color: #666;
	}
</style>
