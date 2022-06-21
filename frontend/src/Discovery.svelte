<script lang="ts">
	import type ColumnTable from "arquero/dist/types/table/column-table";
	import type { TypedArray } from "arquero/dist/types/table/table";
	import MetadataBar from "./filtering/MetadataBar.svelte";
	import SelectionBar from "./filtering/SelectionBar.svelte";
	import { filteredTable, model } from "./stores";
	import ReglScatter from "./scatter/ReglScatter.svelte";
	import Samples from "./samples/Samples.svelte";
	import SamplesOptions from "./samples/SampleOptions.svelte";

	filteredTable.subscribe((d) => d);

	async function projectEmbeddings2D(model: string) {
		const response = await fetch("api/projection", {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ model }),
		});
		const output = await response.json();
		return output;
	}
	$: if (filteredTable !== undefined) {
		console.log($filteredTable);
	}
	let projection: any[] | TypedArray = [[], []];
	let formattedProjection = [];
	const hasColumn = (dt: ColumnTable, colName: string) =>
		dt._names.includes(colName);
	const embedKeys = { x: "zenoembed_x", y: "zenoembed_y" };

	$: {
		if (
			hasColumn($filteredTable, embedKeys.x) &&
			hasColumn($filteredTable, embedKeys.y)
		) {
			projection = [
				$filteredTable.columnArray(embedKeys.x),
				$filteredTable.columnArray(embedKeys.y),
			];

			const [x, y] = projection;
			formattedProjection = [];
			for (let i = 0; i < x.length; i++) {
				const coordinate = [x[i], y[i]];
				formattedProjection.push(coordinate);
			}
		}
	}
</script>

<div id="main">
	<MetadataBar />
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
				colorIdxs={formattedProjection.map((_) => 0)}
				colors={["#CCCCCC"]}
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
					const _projection = await projectEmbeddings2D($model);
					console.log(_projection);
					console.log(projection);
					console.log(formattedProjection);
				}}
				>Compute projection
			</button>
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
