<script lang="ts">
	// function resetSelection(pos) {
	// 	selection.values[pos] = undefined;
	// if (
	// 		selection.values[0] === undefined &&
	// 		selection.values[1] === undefined
	// 	) {
	// 		selection.values = [];
	// 		setSelection();
	// 	}
	// }

	// metadataSelections.subscribe((sel) => {
	// 	if (!sel.has(hash)) {
	// 		selection.values = [];
	// 	}
	// });
</script>

<!-- <div class="inline">
	<div class="date-container">
		start: <input
			type="datetime-local"
			on:change={(el) => {
				// selection.values[0] = new Date(el.target.value);
				// setSelection();
			}} />
		<span class="reset" on:click={() => resetSelection(0)}>reset</span>
	</div>
	<div class="date-container">
		end: -->
<!-- <input
			type="datetime-local"
			on:change={(el) => {
				selection.values[1] = new Date(el.target.value);
				setSelection();
			}}
			value={selection.values[1]
				? selection[1].toISOString().slice(0, 16)
				: histogram[1].toISOString().slice(0, 16)} /> -->
<!-- <span class="reset" on:click={() => resetSelection(1)}>reset</span>
	</div>
</div> -->

<!-- <style>
	.date-container {
		margin-left: 5px;
		margin-top: 10px;
		margin-bottom: 10px;
		color: #666;
	}
	input {
		margin-left: 15px;
	}
	.reset {
		margin-left: 15px;
		color: #6a1b9a;
		cursor: pointer;
	}
	.reset:hover {
		color: #666;
	}
</style> -->
