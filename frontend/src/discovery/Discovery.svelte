<script lang="ts">
	import MetadataBar from "../filtering/MetadataBar.svelte";
	import SelectionBar from "../filtering/SelectionBar.svelte";
	import { filteredTable, model, settings } from "../stores";
	import LegendaryScatter from "./scatter/LegendaryScatter.svelte";
	import Select, { Option } from "@smui/select";
	import Samples from "../samples/Samples.svelte";
	import SampleOptions from "../samples/SampleOptions.svelte";
	import {
		projectEmbeddings2D,
		reformatAPI,
		interpolateColorToArray,
	} from "./discovery";
	import * as d3 from "d3";

	export let scatterWidth = 900;
	export let scatterHeight = 700;

	let projection2D: number[][] = [];
	let colorValues: number[] = [];
	let opacityValues: number[] = [];
	let colorBy: string = "label";
	type dataType = "categorical" | "continuous";
	let dataType: dataType = "categorical";
	let colorRange: string[] = d3.schemeCategory10 as string[];

	function getBins(values: number[], bins: number = 10) {
		const [minValue, maxValue] = d3.extent(values, (d) => Number(d));
		const range = maxValue - minValue;
		const binInterval = range / bins;
		const binsArray = new Array(bins)
			.fill(0)
			.map((_, i) => minValue + i * binInterval);
		console.log(binsArray);
		return binsArray;
	}
	function binContinuous(values: number[], bins: number = 10) {
		if (bins <= 0) return;
		const binsArray = getBins(values, bins);
		let assignments = [];
		valueIterator: for (let i = 0; i < values.length; i++) {
			const value = values[i];
			binIterator: for (
				let j = 0, k = 1;
				j < binsArray.length && k < binsArray.length - 1;
				j++, k++
			) {
				const withinBin =
					value >= binsArray[j] && value <= binsArray[k];
				if (withinBin) {
					assignments.push(j);
					break binIterator;
				}
			}
		}
		return assignments;
	}
	function getDataRange<T>(arrayOfValues: T[], categoryThreshold = 10) {
		const rangeMap = new Map();
		let dataType: dataType = "categorical";
		for (const value of arrayOfValues) {
			if (!rangeMap.has(value)) {
				rangeMap.set(value, 0);
			}
			if (rangeMap.size > categoryThreshold) {
				dataType = "continuous";
				break;
			}
		}

		let outputRange = [];
		if (dataType === "categorical") {
			let categories = [];
			for (const [category, _] of rangeMap) {
				categories.push(category);
			}
			outputRange = categories;
		} else if (dataType === "continuous") {
			const continuous = new Array(10)
				.fill(0)
				.map((_, i) => (i + 1) / 10);
			outputRange = continuous;
		}

		return { range: outputRange, type: dataType };
	}

	$: metadataExists =
		$settings.metadata.length > 0 || $filteredTable._names.length > 0;

	let selectedMetadata,
		dataRange,
		legendaryScatterLegend,
		legendaryScatterPoints;
	let oldIds: any[] = [];
	let newIds: any[] = [];
	function updateMetadata(colorBy: string) {
		return $filteredTable.columnArray(colorBy) as string[];
	}
	function saveIds() {
		return $filteredTable.columnArray("id").map((d) => d) as string[];
	}
	$: if (metadataExists) {
		selectedMetadata = updateMetadata(colorBy);
		oldIds = saveIds();
		const { range, type } = getDataRange(selectedMetadata);
		dataRange = range;
		dataType = type;
		if (dataType === "categorical") {
			colorValues = selectedMetadata.map((md) => dataRange.indexOf(md));
			colorRange = d3.schemeCategory10 as string[];
		} else if (dataType === "continuous") {
			const binAssignments = binContinuous(selectedMetadata);
			colorValues = binAssignments.map((ass) => dataRange[ass]);
			colorRange = interpolateColorToArray(
				d3.interpolateBuPu,
				dataRange.length
			);
		}
	}
	$: {
		if (metadataExists) {
			newIds = $filteredTable.columnArray("id").map((d) => d) as string[];
			const wentBack = oldIds.length > newIds.length; // cursed bug -> fix this idiot
			opacityValues = selectedMetadata.map((_, i) =>
				wentBack || newIds.includes(oldIds[i]) ? 0.75 : 0.1
			);
		}
	}
	$: {
		if (metadataExists) {
			legendaryScatterLegend = reformatAPI.legendaryScatter.legend(
				colorRange,
				dataRange
			);
			legendaryScatterPoints = reformatAPI.legendaryScatter.points(
				projection2D,
				colorValues,
				opacityValues
			);
		}
	}
</script>

<div id="main">
	<MetadataBar />
	<div>
		<div>
			{#if metadataExists}
				<Select bind:value={colorBy} label={"Color Points By"}>
					{#each $settings.metadata as metadataName, i}
						<Option value={metadataName}>{metadataName}</Option>
					{/each}
				</Select>
			{/if}
		</div>
		<div style:margin-top="10px">
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
					on:deselect={({ detail }) => {
						console.log(detail);
					}}
					on:select={({ detail }) => {
						console.log(detail);
					}}
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
					if ($filteredTable) {
						const filteredIds = $filteredTable.columnArray("id");
						const _projection = await projectEmbeddings2D(
							$model,
							filteredIds
						);
						projection2D = _projection.data.map(
							({ proj, id }) => proj
						);
					}
				}}
				>Compute projection
			</button>
		</div>
	</div>
	<div>
		<SampleOptions />
		<Samples />
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
</style>
