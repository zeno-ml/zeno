<script lang="ts">
	import { ready, models } from "../../../stores";
	import Select, { Option } from "@smui/select";
	import Checkbox from "@smui/checkbox";
	import FormField from "@smui/form-field";
	$: color = "model";
	let selectedModel = [...$models];
</script>

{#if $ready}
	<div id="mark">
		<h4 class="edit-type">Marks</h4>
		<div id="mark-flex">
			<div class="parameters">
				<h4 class="select-label">color</h4>
				<Select bind:value={color} class="select" variant="outlined">
					<Option value={"model"}>Model</Option>
					<Option value={"slice"}>Slice</Option>
				</Select>
			</div>
			{#if color === "model"}
				<div class="models">
					{#each $models as m}
						<FormField>
							<Checkbox bind:group={selectedModel} value={m} />
							<span slot="label">{m}</span>
						</FormField>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 280px;
	}
	#mark {
		margin-bottom: 20px;
	}
	.edit-type {
		border-bottom: 1px solid var(--G4);
	}
	#mark-flex {
		display: flex;
		flex-direction: column;
	}
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.models {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}
	.select-label {
		margin: 5px;
	}
</style>
