<script lang="ts">
	import { folders, report, reports, slices } from "../../../stores";
	import Svelecte from "svelecte";

	let options = [];
	let value = 0;
	let folder = "-- Select Folder --";
	let refresh = 0;

	function initialOptions(optionsArray: string[]) {
		optionsArray.forEach((s, i) => {
			options[i] = { value: i, label: s };
		});
	}

	function initialSettings() {
		// restore default first value when fixing dimension with empty options
		if ($reports[$report].slices.length === 0) {
			$reports[$report].slices = [...Array.from($slices.keys()).slice(0, 1)];
		}
		// initial options & values
		initialOptions([...$slices.keys()]);
		value = options.find((o) => o.label === $reports[$report].slices[0]).value;
	}

	$: initialSettings();
</script>

<div class="parameters">
	<h4 class="select-label">&nbsp;</h4>
	<Svelecte
		style="width: 280px; flex:none;"
		bind:value={folder}
		options={["-- Select Folder --", ...$folders.values()]}
		labelAsValue
		placeholder="Select Folder..."
		on:change={(e) => {
			if (e.detail && e.detail.label !== "-- Select Folder --") {
				options = [];
				let slicesInFolder = [...$slices.values()]
					.filter((s) => s.folder === e.detail.label)
					.map((s) => s.sliceName);
				initialOptions(slicesInFolder);
			} else {
				// show all slices if not selected any folder
				initialOptions([...$slices.keys()]);
			}
			value = 0;
			refresh++;
		}} />
</div>

{#key refresh}
	<div class="parameters">
		<h4 class="select-label">&nbsp;</h4>
		<Svelecte
			style="width: 280px; flex:none;"
			bind:value
			{options}
			on:change={(e) => {
				if (e.detail && e.detail.label !== $reports[$report].slices[0]) {
					let tmpSlices = $reports[$report].slices;
					if (tmpSlices.includes(e.detail.label)) {
						tmpSlices.splice(tmpSlices.indexOf(e.detail.label), 1);
					}
					tmpSlices.unshift(e.detail.label);
					$reports[$report].slices = tmpSlices;
				}
			}} />
	</div>
{/key}

<style>
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.select-label {
		margin: 5px;
	}
</style>
