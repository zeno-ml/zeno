<script lang="ts">
	const defaultParams = {
		numNeighborsUMAP: 15,
		minDistUMAP: 0.1,
	};

	export let minDistUMAP = defaultParams.minDistUMAP;
	export let numNeighborsUMAP = defaultParams.numNeighborsUMAP;
</script>

<div>
	<h3>UMAP Parameters (not working right now)</h3>
	<div>
		<label for="min-dist">Min Dist</label>
		<input
			id="min-dist"
			bind:value={minDistUMAP}
			type="range"
			step="0.1"
			min="0.1"
			max="3.0" />
		{minDistUMAP}
	</div>

	<div>
		<label for="nn">Num Neighbors</label>
		<input
			id="nn"
			type="range"
			bind:value={numNeighborsUMAP}
			step="10"
			min="5"
			max="100" />
		{numNeighborsUMAP}
	</div>
</div>
