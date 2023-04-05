<script lang="ts">
	import { report, reports } from "../../../stores";
	import SlicesEncodingDropdown from "./SlicesEncodingDropdown.svelte";
	import SlicesEncodingMultiChoice from "./SlicesEncodingMultiChoice.svelte";
	import SecondSlicesEncoding from "./SecondSlicesEncoding.svelte";
	import MetricsEncodingDropdown from "./MetricsEncodingDropdown.svelte";
	import MetricsEncodingMultiChoice from "./MetricsEncodingMultiChoice.svelte";
	import ModelsEncodingDropdown from "./ModelsEncodingDropdown.svelte";
	import ModelsEncodingMultiChoice from "./ModelsEncodingMultiChoice.svelte";
	import { ChartType } from "../../../zenoservice";
	import Svelecte from "svelecte";

	const EncodingMap = {
		slices: {
			fixed: SlicesEncodingDropdown,
			multi: SlicesEncodingMultiChoice,
		},
		metrics: {
			fixed: MetricsEncodingDropdown,
			multi: MetricsEncodingMultiChoice,
		},
		models: {
			fixed: ModelsEncodingDropdown,
			multi: ModelsEncodingMultiChoice,
		},
	};
	const labelMap = {
		[ChartType.BAR]: {
			x: "x",
			y: "y",
			color: "color",
		},
		[ChartType.LINE]: {
			x: "x",
			y: "y",
			color: "color",
		},
		[ChartType.TABLE]: {
			x: "x",
			y: "y",
			color: "layer",
		},
		[ChartType.BEESWARM]: {
			x: "x",
			y: "y",
			color: "color",
		},
		[ChartType.RADAR]: {
			x: "axis",
			y: "layer",
			color: "fixed",
		},
		[ChartType.HEATMAP]: {
			x: "x",
			y: "y",
			color: "color",
		},
	};
	const optionMap = {
		// bar chart select option dropdown
		[ChartType.BAR]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "metrics" }],
			color: [{ label: "slices" }, { label: "models" }],
		},
		// line chart select option dropdown
		[ChartType.LINE]: {
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
		// beeswarm chart select option dropdown
		[ChartType.BEESWARM]: {
			x: [{ label: "metrics" }],
			y: [{ label: "slices" }, { label: "models" }],
			color: [{ label: "slices" }, { label: "models" }],
		},
		// radar chart select option dropdown
		[ChartType.RADAR]: {
			x: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
			y: [{ label: "slices" }, { label: "models" }],
			color: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
		},
		// heat map select option dropdown
		[ChartType.HEATMAP]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "slices" }, { label: "models" }],
			color: [{ label: "metrics" }],
		},
	};

	$: currentReport = $reports[$report];
	$: chartType = currentReport.type;
	$: parameters = currentReport.parameters;
	$: fixed_dimension = currentReport.parameters.fixedDimension;

	function refreshParams(e, currentParam) {
		let label = e.detail.label;
		let paramExcluMap = { slices: "models", models: "slices" };
		// bar&line chart exclusive combination
		if (chartType === ChartType.BAR || chartType === ChartType.LINE) {
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
			if (currentParam === "x") {
				parameters.xEncoding = label;
				parameters.yEncoding = paramExcluMap[label];
			} else if (currentParam === "y") {
				parameters.yEncoding = label;
				parameters.xEncoding = paramExcluMap[label];
			}
		}
		// beeswarm exclusive combination
		else if (chartType === ChartType.BEESWARM) {
			if (currentParam === "y") {
				parameters.yEncoding = label;
				parameters.colorEncoding = paramExcluMap[label];
			} else if (currentParam === "color") {
				parameters.colorEncoding = label;
				parameters.yEncoding = paramExcluMap[label];
			}
		}
		// radar exclusive combination
		else if (chartType === ChartType.RADAR) {
			if (currentParam === "x") {
				parameters.xEncoding = label;
				if (label === "metrics") {
					parameters.colorEncoding = paramExcluMap[parameters.yEncoding];
				} else {
					parameters.colorEncoding = "metrics";
					parameters.yEncoding = paramExcluMap[label];
				}
			} else if (currentParam === "y") {
				parameters.yEncoding = label;
				if (parameters.xEncoding === "metrics") {
					parameters.colorEncoding = paramExcluMap[label];
				} else if (parameters.colorEncoding === "metrics") {
					parameters.xEncoding = paramExcluMap[label];
				}
			} else if (currentParam === "color") {
				parameters.colorEncoding = label;
				if (label === "metrics") {
					parameters.xEncoding = paramExcluMap[parameters.yEncoding];
				} else {
					parameters.xEncoding = "metrics";
					parameters.yEncoding = paramExcluMap[label];
				}
			}
		}
		// heat map exclusive combination
		else if (chartType === ChartType.HEATMAP) {
			if (currentParam === "x") {
				parameters.xEncoding = label;
				if (label === "models") {
					parameters.yEncoding = paramExcluMap[label];
				}
			} else if (currentParam === "y") {
				parameters.yEncoding = label;
				if (label === "models") {
					parameters.xEncoding = paramExcluMap[label];
				}
			}
		}
		$reports[$report] = currentReport;
	}
</script>

<div id="encoding">
	<h4 class="edit-type">Encoding</h4>
	<div id="encoding-flex">
		<!-- x encoding start -->
		<div class="encoding-section">
			<div class="parameters">
				<h4>{labelMap[chartType].x}</h4>
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
			{#if chartType === ChartType.BEESWARM}
				<label>
					<input
						type="radio"
						bind:group={$reports[$report].parameters.fixedDimension}
						name="fixed_dimension"
						value={"x"} />
					<span> Fix this dimension (Dropdown)</span>
				</label>
			{/if}
			<svelte:component
				this={fixed_dimension === "x"
					? EncodingMap[parameters.xEncoding].fixed
					: EncodingMap[parameters.xEncoding].multi} />
		</div>
		<!-- x encoding end-->

		<!-- y encoding -->
		<div class="encoding-section">
			<div class="parameters">
				<h4>{labelMap[chartType].y}</h4>
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
			{#if chartType === ChartType.BEESWARM || chartType === ChartType.TABLE}
				<label>
					<input
						type="radio"
						bind:group={$reports[$report].parameters.fixedDimension}
						name="fixed_dimension"
						value={"y"} />
					<span> Fix this dimension (Dropdown)</span>
				</label>
			{/if}
			{#if chartType === ChartType.HEATMAP && parameters.xEncoding === parameters.yEncoding}
				<SecondSlicesEncoding />
			{:else}
				<svelte:component
					this={fixed_dimension === "y"
						? EncodingMap[parameters.yEncoding].fixed
						: EncodingMap[parameters.yEncoding].multi} />
			{/if}
		</div>
		<!-- y encoding end-->

		<!-- heatmap slice vs slice fix model-->
		{#if chartType === ChartType.HEATMAP && parameters.xEncoding === parameters.yEncoding}
			<div class="encoding-section">
				<div class="parameters">
					<h4>fixed</h4>
					<Svelecte
						style="width: 280px; height: 30px; flex:none;"
						value={"models"}
						options={[{ label: "models" }]}
						searchable={false} />
				</div>
				<ModelsEncodingDropdown />
			</div>
		{/if}

		<!-- color encoding start-->
		<div class="encoding-section">
			<div class="parameters">
				<h4>{labelMap[chartType].color}</h4>
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
			{#if chartType === ChartType.TABLE}
				<label>
					<input
						type="radio"
						bind:group={$reports[$report].parameters.fixedDimension}
						name="fixed_dimension"
						value={"color"} />
					<span> Fix this dimension (Dropdown)</span>
				</label>
			{/if}
			<svelte:component
				this={fixed_dimension === "color"
					? EncodingMap[parameters.colorEncoding].fixed
					: EncodingMap[parameters.colorEncoding].multi} />
		</div>
		<!-- color encoding end-->
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
		margin-bottom: 100px;
	}
	.encoding-section {
		margin-bottom: 15px;
	}
	.encoding-section label {
		padding-left: 59px;
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
