<script>
	import { Icon } from "@smui/button";
	import { compareSort } from "../stores";
	export let model;
	export let columnHeader;
	export let selectSort;
</script>

<div style="width: 160px; display: flex; align-items:center;">
	<div>
		<div>{model}</div>
		<div>{columnHeader.name}</div>
	</div>
	{#if selectSort === model}
		<Icon class="material-icons" style="font-size: 25px; padding-top:3px;">
			{#if $compareSort[0] && $compareSort[1]}
				arrow_drop_up
			{:else if $compareSort[0]}
				arrow_drop_down
			{/if}
		</Icon>
	{/if}
</div>
