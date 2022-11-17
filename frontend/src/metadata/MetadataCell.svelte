<script lang="ts">
	import BinaryMetadataCell from "./cells/BinaryMetadataCell.svelte";
	import NominalMetadataCell from "./cells/NominalMetadataCell.svelte";
	import ContinuousMetadataCell from "./cells/ContinuousMetadataCell.svelte";
	import DateMetadataCell from "./cells/DateMetadataCell.svelte";
	import TextMetadataCell from "./cells/TextMetadataCell.svelte";

	import { MetadataType } from "../globals";
	import { selections } from "../stores";
	import { columnHash } from "../util/util";

	export let col: ZenoColumn;
	export let shouldColor = false;
	export let histogram;

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

{#if histogram}
	<div class="cell">
		<div id="info">
			<div id="label" class="top-text">
				<span style:color={shouldColor ? "#9B52DF" : ""}>
					{col.name}
				</span>
			</div>
		</div>
		<svelte:component
			this={columnMap[col.metadataType]}
			filterPredicates={filterPredicates.predicates}
			{updatePredicates}
			{col}
			{histogram}
			{shouldColor} />
	</div>
{/if}

<style>
	.cell {
		border-top: 1px solid #e0e0e0;
		border-bottom: 1px solid #e0e0e0;
		padding: 10px;
		min-width: calc(100% - 30px);
		width: fit-content;
		display: flex;
		flex-direction: column;
	}
	#info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		margin-left: 5px;
		margin-bottom: 5px;
		color: #666;
	}
	.top-text {
		height: 18px;
	}
</style>
