<script lang="ts">
	import SegmentedButton, { Label, Segment } from "@smui/segmented-button";
	import Tooltip, { Wrapper } from "@smui/tooltip";

	let choices = ["Label", "Model"];
	let selected = ["Label"];

	export let table;
	export let modelColumn;
	export let labelColumn;
	export let dataColumn;
	export let idColumn;
</script>

<div style:margin-left="10px">
	<SegmentedButton segments={choices} let:segment bind:selected>
		<Segment {segment}>
			<Label>{segment}</Label>
		</Segment>
	</SegmentedButton>
</div>
<div class="break" />
{#each table as row}
	<div class="box">
		<Wrapper>
			<div id="overlays">
				<img
					src="/data/{row[idColumn]}"
					style:width="150px"
					style:height="150px"
					alt="Image thumbnail for instance {row[idColumn]}" />
				{#if selected.includes("Label")}
					<img
						class="overlay"
						src="/labels/{row[labelColumn]}"
						style:width="150px"
						style:height="150px"
						alt="Image thumbnail for instance {row[labelColumn]}" />
				{/if}
				{#if row[modelColumn] && selected.includes("Model")}
					<img
						class="overlay"
						src="/cache/{modelColumn}/{row[modelColumn]}"
						style:width="150px"
						style:height="150px"
						alt="Image thumbnail for instance {row[modelColumn]}" />
				{/if}
			</div>
			<Tooltip>
				{#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
					{key} : {row[key]}
					<br />
				{/each}
			</Tooltip>
		</Wrapper>
	</div>
{/each}

<style>
	#overlays {
		position: relative;
	}
	.overlay {
		filter: invert(100%) opacity(40%);
		left: 0px;
		position: absolute;
	}
	.box {
		padding: 10px;
		margin: 10px;
		border: 0.5px solid rgb(224, 224, 224);
	}
	.break {
		flex-basis: 100%;
		height: 0;
	}
</style>
