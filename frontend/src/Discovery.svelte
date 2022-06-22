<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { TypedArray } from "arquero/dist/types/table/table";
	import MetadataBar from "./filtering/MetadataBar.svelte";
	import SelectionBar from "./filtering/SelectionBar.svelte";
	import { filteredTable, model, settings } from "./stores";
	import ReglScatter from "./scatter/ReglScatter.svelte";
	import Samples from "./samples/Samples.svelte";
	import SamplesOptions from "./samples/SampleOptions.svelte";
	import * as d3 from "d3";

	filteredTable.subscribe((d) => d);

	async function projectEmbeddings2D(
		model: string,
		instance_ids: any[] | TypedArray = []
	) {
		const response = await fetch("api/projection", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ model, instance_ids }),
		});
		const output = await response.json();
		return JSON.parse(output);
	}
	$: if (filteredTable !== undefined) {
		console.log($filteredTable);
	}
	let projection: any[] | TypedArray = [[], []];
	let formattedProjection = [];
	const hasColumn = (dt: ColumnTable, colName: string) =>
		dt._names.includes(colName);
	const embedKeys = { x: "zenoembed_x", y: "zenoembed_y" };

	let sliceSelectedForColoring = "zenopost_cifar_net_1_incorrect";
	const cifar10Labels = [
		"airplane",
		"automobile",
		"bird",
		"cat",
		"deer",
		"dog",
		"frog",
		"horse",
		"ship",
		"truck",
	];
	let colorCombos = {
		label: {
			colorer: (label) => cifar10Labels.indexOf(label),
			colors: d3.schemeCategory10,
		},
		zenopost_cifar_net_1_incorrect: {
			colorer: (item: any) => Number(item),
			colors: [d3.color("steelblue").hex(), d3.color("salmon").hex()],
		},
	};
	let colorIdx: any[] = [];
	let selectedColorer = "label";
	$: {
		const metadataExist = $settings.metadata.length > 0;
		if (metadataExist) {
			colorIdx = $filteredTable
				.columnArray(selectedColorer)
				.map((row) => colorCombos[selectedColorer].colorer(row));
		}
	}
</script>

<div id="main">
	<MetadataBar />
	<button
		on:click={() => {
			if (selectedColorer === "label") {
				selectedColorer = "zenopost_cifar_net_1_incorrect";
			} else {
				selectedColorer = "label";
			}
		}}>Switch coloring</button
	>
	<div>
		<div>
			<p>{$filteredTable.size}</p>
			<SelectionBar />
		</div>
		<div>
			<ReglScatter
				width={600}
				height={600}
				points={formattedProjection}
				colorIdxs={colorIdx}
				colors={colorCombos[selectedColorer].colors}
				createScatterConfig={{
					pointSize: 3,
					opacity: 0.65,
					lassoColor: [0.737, 0.345, 0.894, 0.5],
					pointOutlineWidth: 3,
				}}
				canvasStyle={"border: 1px solid lightgrey;"}
				on:select={({ detail: selectedPoints }) => {}}
				on:deselect={({ detail: selectedPoints }) => {}}
			/>
		</div>
		<div>
			<button
				on:click={async () => {
					const filteredIds = $filteredTable.columnArray("id");
					const _projection = await projectEmbeddings2D(
						$model,
						filteredIds
					);
					formattedProjection = _projection.data.map(
						({ proj, id }) => proj
					);
				}}
				>Compute projection
			</button>
		</div>
		<div>
			{#each $settings.metadata ?? [] as md, i}
				<div>
					{md}
				</div>
			{/each}
		</div>
	</div>
	<div>
		<SamplesOptions />
		<Samples rowsPerPage={100} />
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
</style>
