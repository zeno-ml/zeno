<script lang="ts">
	import { report, reports } from "../../../stores";
	import SlicesEncoding from "./SlicesEncodingMultiChoice.svelte";
	import MetricsEncoding from "./MetricsEncodingDropdown.svelte";
	import ModelsEncoding from "./ModelsEncodingMultiChoice.svelte";
	import { ChartType } from "../../../zenoservice";
	import Svelecte from "svelecte";

	const EncodingMap = {
		slices: SlicesEncoding,
		models: ModelsEncoding,
		metrics: MetricsEncoding,
	};

	const optionMap = {
		// bar chart select option dropdown
		[ChartType.BAR]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "metrics" }],
			color: [{ label: "slices" }, { label: "models" }],
		},
		// table view select option dropdown
		[ChartType.TABLE]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "slices" }, { label: "models" }],
			color: [{ label: "metrics" }],
		},
		// line chart select option dropdown
		[ChartType.LINE]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "metrics" }],
			color: [{ label: "slices" }, { label: "models" }],
		},
		// beeswarm chart select option dropdown
		[ChartType.BEESWARM]: {
			x: [{ label: "metrics" }],
			y: [{ label: "models" }],
			color: [{ label: "slices" }],
		},
	};

	let fixed_dimension = 2;

	$: currentReport = $reports[$report];
	$: chartType = currentReport.type;
	$: parameters = currentReport.parameters;

	function refreshParams(e, currentParam) {
		// bar/line chart exclusive combination
		let label = e.detail.label;
		if (chartType === ChartType.BAR || chartType === ChartType.LINE) {
			let paramExcluMap = { slices: "models", models: "slices" };
			if (currentParam === "x") {
				parameters.xEncoding = label;
				parameters.colorEncoding = paramExcluMap[label];
			} else if (currentParam === "color") {
				parameters.colorEncoding = label;
				parameters.xEncoding = paramExcluMap[label];
			}
		}
		// table view exclusive combination
		else if (chartType === ChartType.TABLE) {
			let paramExcluMap = { slices: "models", models: "slices" };
			if (currentParam === "x") {
				parameters.xEncoding = label;
				parameters.yEncoding = paramExcluMap[label];
			} else if (currentParam === "y") {
				parameters.yEncoding = label;
				parameters.xEncoding = paramExcluMap[label];
			}
		}
		$reports[$report] = currentReport;
	}
</script>

<div id="encoding">
	<h4 class="edit-type">Encoding</h4>
	<div id="encoding-flex">
		<div class="encoding-section">
			<div class="parameters">
				<h4>x</h4>
				<Svelecte
					style="width: 280px; height: 30px; flex:none"
					value={parameters.xEncoding}
					options={optionMap[chartType].x}
					searchable={false}
					on:change={(e) => {
						if (e.detail.label !== parameters.xEncoding) {
							refreshParams(e, "x");
						}
					}} />
			</div>
			<label>
				<input
					type="radio"
					bind:group={fixed_dimension}
					name="fixed_dimension"
					value={1} />
				<span> Fix this dimension (Dropdown)</span>
			</label>
			<svelte:component this={EncodingMap[parameters.xEncoding]} />
		</div>

		<div class="encoding-section">
			<div class="parameters">
				<h4>y</h4>
				<Svelecte
					style="width: 280px; height: 30px; flex:none"
					value={parameters.yEncoding}
					options={optionMap[chartType].y}
					searchable={false}
					on:change={(e) => {
						if (e.detail.label !== parameters.yEncoding) {
							refreshParams(e, "y");
						}
					}} />
			</div>
			<label>
				<input
					type="radio"
					bind:group={fixed_dimension}
					name="fixed_dimension"
					value={2} />
				<span> Fix this dimension (Dropdown)</span>
			</label>
			<svelte:component this={EncodingMap[parameters.yEncoding]} />
		</div>

		<div class="encoding-section">
			{#if chartType !== ChartType.TABLE}
				<div class="parameters">
					<h4>color</h4>
					<Svelecte
						style="width: 280px; height: 30px; flex:none;"
						value={parameters.colorEncoding}
						options={optionMap[chartType].color}
						searchable={false}
						on:change={(e) => {
							if (e.detail.label !== parameters.colorEncoding) {
								refreshParams(e, "color");
							}
						}} />
				</div>
			{/if}
			<label>
				<input
					type="radio"
					bind:group={fixed_dimension}
					name="fixed_dimension"
					value={3} />
				<span> Fix this dimension (Dropdown)</span>
			</label>
			<svelte:component this={EncodingMap[parameters.colorEncoding]} />
		</div>
	</div>
</div>

<style>
	.edit-type {
		border-bottom: 1px solid var(--G4);
	}
	#encoding {
		margin-bottom: 50px;
	}
	#encoding-flex {
		display: flex;
		flex-direction: column;
	}
	.encoding-section {
		margin-bottom: 15px;
	}
	.encoding-section label {
		padding-left: 60px;
	}
	.encoding-section input {
		vertical-align: middle;
	}
	.encoding-section label span {
		vertical-align: middle;
	}
	.parameters {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		padding: 10px;
	}
	.parameters h4 {
		margin: 5px;
	}
</style>
