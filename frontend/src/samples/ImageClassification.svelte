<script lang="ts">
	import Tooltip, { Wrapper } from "@smui/tooltip";

	export let table;
	export let modelColumn;
	export let labelColumn;
	export let dataColumn;
	export let transformColumn;
	export let idColumn;
	export let color = "white";

	console;
</script>

{#each table as row}
	<div class="box" style:background-color={color}>
		<Wrapper>
			<img
				src="/data/{row[idColumn]}"
				style:max-width="200px"
				alt="Image thumbnail for instance {row[idColumn]}" />
			<Tooltip>
				{#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
					{key} : {row[key]}
					<br />
				{/each}
			</Tooltip>
		</Wrapper>
		{#if transformColumn}
			<Wrapper>
				<img
					src={`/cache/${transformColumn}/${row[transformColumn]}`}
					style:max-width="200px"
					alt="Image thumbnail for instance {row[transformColumn]}" />
				<Tooltip>
					{#each Object.keys(row).filter((r) => !r.startsWith("zeno")) as key}
						{key} : {row[key]}
						<br />
					{/each}
				</Tooltip>
			</Wrapper>
		{/if}
		<br />
		<span class="label">label: </span><span class="value">
			{row[labelColumn]}
		</span>
		{#if modelColumn && row[modelColumn]}
			<br />
			<span class="label">pred: </span>
			<span class="value">{row[modelColumn]} </span>
		{/if}
	</div>
{/each}

<style>
	.label {
		font-size: 10px;
		color: rgba(0, 0, 0, 0.5);
		font-variant: small-caps;
	}
	.value {
		font-size: 10px;
	}
	.box {
		padding: 10px;
		margin: 10px;
		border: 0.5px solid rgb(224, 224, 224);
	}
</style>
