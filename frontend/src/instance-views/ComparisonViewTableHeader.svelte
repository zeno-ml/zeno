<script>
	import { Icon } from "@smui/button";
	import { compareSort } from "../stores";
	export let header;
	export let selectColumn;
	export let sortModel;
</script>

<div style="display: flex; align-items:center;">
	<div>
		<div>{header ? header : "difference"}</div>
		<div class="header">{selectColumn.name}</div>
	</div>
	{#if sortModel === header}
		<Icon class="material-icons" style="font-size: 25px; padding-top:3px;">
			{#if $compareSort[0] && $compareSort[1]}
				arrow_drop_up
			{:else if $compareSort[0]}
				arrow_drop_down
			{/if}
		</Icon>
	{/if}
</div>

<style>
	.header {
		font-weight: 400;
		color: var(--G2);
	}
</style>
