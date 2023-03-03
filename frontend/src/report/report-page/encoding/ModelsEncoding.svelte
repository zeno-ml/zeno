<script lang="ts">
	import { ready, report, reports, models } from "../../../stores";
	import Checkbox from "@smui/checkbox";
	import FormField from "@smui/form-field";

	$: currentReport = $reports[$report];
</script>

{#if ready}
	<div class="models">
		{#each $models as m}
			<FormField>
				<Checkbox bind:group={currentReport.models} value={m} />
				<span>{m}</span>
			</FormField>
		{/each}
	</div>
{/if}

<style>
</style>
