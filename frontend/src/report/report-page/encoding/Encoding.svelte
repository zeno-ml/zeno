<script lang="ts">
	import { report, reports } from "../../../stores";
	import SlicesEncodingDropdown from "./SlicesEncodingDropdown.svelte";
	import SlicesEncodingMultiChoice from "./SlicesEncodingMultiChoice.svelte";
	import MetricsEncodingDropdown from "./MetricsEncodingDropdown.svelte";
	import MetricsEncodingMultiChoice from "./MetricsEncodingMultiChoice.svelte";
	import ModelsEncodingDropdown from "./ModelsEncodingDropdown.svelte";
	import ModelsEncodingMultiChoice from "./ModelsEncodingMultiChoice.svelte";
	import FixDimension from "./FixDimension.svelte";
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
			z: "color",
		},
		[ChartType.LINE]: {
			x: "x",
			y: "y",
			z: "color",
		},
		[ChartType.TABLE]: {
			x: "x",
			y: "y",
			z: "fixed",
		},
		[ChartType.BEESWARM]: {
			x: "x",
			y: "y",
			z: "color",
		},
		[ChartType.RADAR]: {
			x: "axis",
			y: "layer",
			z: "fixed",
		},
		[ChartType.HEATMAP]: {
			x: "x",
			y: "y",
			z: "color",
		},
	};
	const optionMap = {
		// bar chart select option dropdown
		[ChartType.BAR]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "metrics" }],
			z: [{ label: "slices" }, { label: "models" }],
		},
		// line chart select option dropdown
		[ChartType.LINE]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "metrics" }],
			z: [{ label: "slices" }, { label: "models" }],
		},
		// table view select option dropdown
		[ChartType.TABLE]: {
			x: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
			y: [{ label: "slices" }, { label: "models" }],
			z: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
		},
		// beeswarm chart select option dropdown
		[ChartType.BEESWARM]: {
			x: [{ label: "metrics" }],
			y: [{ label: "slices" }, { label: "models" }],
			z: [{ label: "slices" }, { label: "models" }],
		},
		// radar chart select option dropdown
		[ChartType.RADAR]: {
			x: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
			y: [{ label: "slices" }, { label: "models" }],
			z: [{ label: "slices" }, { label: "models" }, { label: "metrics" }],
		},
		// heat map select option dropdown
		[ChartType.HEATMAP]: {
			x: [{ label: "slices" }, { label: "models" }],
			y: [{ label: "slices" }, { label: "models" }],
			z: [{ label: "metrics" }],
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
				parameters.zEncoding = paramExcluMap[label];
			} else if (currentParam === "z") {
				parameters.zEncoding = label;
				parameters.xEncoding = paramExcluMap[label];
			}
		}
		// beeswarm exclusive combination
		else if (chartType === ChartType.BEESWARM) {
			if (currentParam === "y") {
				parameters.yEncoding = label;
				parameters.zEncoding = paramExcluMap[label];
			} else if (currentParam === "z") {
				parameters.zEncoding = label;
				parameters.yEncoding = paramExcluMap[label];
			}
		}
		// radar or table exclusive combination
		else if (chartType === ChartType.RADAR || chartType === ChartType.TABLE) {
			if (currentParam === "x") {
				parameters.xEncoding = label;
				if (label === "metrics") {
					parameters.zEncoding = paramExcluMap[parameters.yEncoding];
				} else {
					parameters.zEncoding = "metrics";
					parameters.yEncoding = paramExcluMap[label];
				}
			} else if (currentParam === "y") {
				parameters.yEncoding = label;
				if (parameters.xEncoding === "metrics") {
					parameters.zEncoding = paramExcluMap[label];
				} else if (parameters.zEncoding === "metrics") {
					parameters.xEncoding = paramExcluMap[label];
				}
			} else if (currentParam === "z") {
				parameters.zEncoding = label;
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
				<FixDimension value={"x"} />
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
			{#if chartType === ChartType.BEESWARM}
				<FixDimension value={"y"} />
			{/if}
			{#if chartType === ChartType.HEATMAP && parameters.yEncoding === "slices"}
				<SlicesEncodingMultiChoice secondSlice={true} />
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

		<!-- z encoding start-->
		<div class="encoding-section">
			<div class="parameters">
				<h4>{labelMap[chartType].z}</h4>
				<Svelecte
					style="width: 280px; height: 30px; flex:none;"
					value={parameters.zEncoding}
					options={optionMap[chartType].z}
					searchable={false}
					on:change={(e) => {
						if (e.detail.label !== parameters.zEncoding) {
							refreshParams(e, "z");
						}
					}} />
			</div>
			<svelte:component
				this={fixed_dimension === "z"
					? EncodingMap[parameters.zEncoding].fixed
					: EncodingMap[parameters.zEncoding].multi} />
		</div>
		<!-- z encoding end-->
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
		margin-bottom: 80px;
	}
	.encoding-section {
		margin-bottom: 15px;
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
