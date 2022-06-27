<script lang="ts">
	import MetadataBar from "../filtering/MetadataBar.svelte";
	import SelectionBar from "../filtering/SelectionBar.svelte";
	import { filteredTable, model, settings } from "../stores";
	import LegendaryScatter from "./scatter/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import {
		projectEmbeddings2D,
		cifar10Labels,
		reformatAPI,
	} from "./discovery";
	import * as d3 from "d3";

	export let scatterWidth = 900;
	export let scatterHeight = 700;

	let projection2D: number[][] = [];
	let colorValues: number[] = [];
	let colorBy: string = "label";
	let colorRange: string[] = d3.schemeCategory10 as string[];

	$: metadataExists = $settings.metadata.length > 0;
	$: {
		if (metadataExists) {
			const selectedMetadata = $filteredTable.columnArray(colorBy);
			colorValues = selectedMetadata.map((md) =>
				cifar10Labels.indexOf(md)
			);
		}
	}

	$: legendaryScatterLegend = reformatAPI.legendaryScatter.legend(
		colorRange,
		cifar10Labels
	);
	$: legendaryScatterPoints = reformatAPI.legendaryScatter.points(
		projection2D,
		colorValues,
		0.75
	);
</script>

<div id="main">
	<MetadataBar />
	<div>
		<div>
			<Select bind:value={colorBy} label={"Color Points By"}>
				{#each $settings.metadata as metadataName, i}
					<Option value={metadataName}>{metadataName}</Option>
				{/each}
			</Select>
		</div>
		<div>
			<div
				style:width="{scatterWidth}px"
				style:height="{scatterHeight}px"
				style:box-shadow="0px 0px 3px 3px hsla(0, 0%, 0%, 0.1)"
				style:padding="0px"
			>
				<LegendaryScatter
					width={scatterWidth}
					height={scatterHeight}
					legend={legendaryScatterLegend}
					points={legendaryScatterPoints}
				/>
			</div>
			<div>
				<p>{$filteredTable.size} instances</p>
				<SelectionBar />
			</div>
		</div>
		<div>
			<button
				on:click={async () => {
					const filteredIds = $filteredTable.columnArray("id");
					const _projection = await projectEmbeddings2D(
						$model,
						filteredIds
					);
					projection2D = _projection.data.map(({ proj, id }) => proj);
				}}
				>Compute projection
			</button>
		</div>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
</style>
