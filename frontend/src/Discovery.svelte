<script lang="ts">
	import MetadataBar from "./filtering/MetadataBar.svelte";
	import SelectionBar from "./filtering/SelectionBar.svelte";
	import { filteredTable, model } from "./stores";

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
</script>

<div id="main">
	<MetadataBar />
	<p>{$filteredTable.size}</p>
	<SelectionBar />
	<div>
		<button
			on:click={async () => {
				const projection = await projectEmbeddings2D($model);
				console.log(projection);
			}}
			>Compute projection
		</button>
	</div>
</div>

<style>
	#main {
		display: flex;
		flex-direction: row;
	}
</style>
