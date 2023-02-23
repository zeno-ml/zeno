<script lang="ts">
	import { ready } from "../../../stores";
	import Select, { Option } from "@smui/select";
</script>

{#if $ready}
	<div id="encoding">
		<h4>Encoding</h4>
		<div id="encoding-flex">
			<div class="parameters">
				<h4 class="select-label">x</h4>
				<Select class="select" variant="outlined">
					<Option value={"slice"}>slice</Option>
				</Select>
			</div>
			<div class="parameters">
				<h4 class="select-label">y</h4>
				<Select class="select" variant="outlined">
					<Option value={"accuracy"}>accuracy</Option>
				</Select>
			</div>
			<div class="parameters">
				<h4 class="select-label">color</h4>
				<Select class="select" variant="outlined">
					<Option value={"color"}>color</Option>
				</Select>
			</div>
			<div class="parameters">
				<h4 class="select-label">size</h4>
				<Select class="select" variant="outlined">
					<Option value={"size"}>size</Option>
				</Select>
			</div>
		</div>
	</div>
{/if}

<style>
	#encoding {
		margin-bottom: 20px;
	}
	* :global(.select .mdc-select__anchor) {
		height: 30px;
		width: 280px;
		align-items: right;
	}
	#encoding-flex {
		display: flex;
		flex-direction: column;
	}
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
