import type { VegaLiteSpec } from "svelte-vega";

export function generateCountSpec({
	width = 350,
	height = 40,
	colors = [],
	opacity = 0.5,
} = {}) {
	const countSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: width,
		height: height,
		layer: [
			{
				params: [
					{
						name: "highlight",
						select: { type: "point", on: "mouseover" },
					},
					{ name: "select", select: { type: "point", encodings: ["x"] } },
				],
				mark: {
					type: "bar",
					opacity: opacity,
					fill: "#ddd",
					cursor: "pointer",
				},
				encoding: {
					x: {
						field: "binStart",
						axis: {
							title: "",
							grid: false,
							tickCount: 2,
							labelColor: "rgba(0, 0, 0, 0.6)",
						},
					},
					y: {
						field: "count",
						type: "quantitative",
						axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
					},
				},
			},
			{
				mark: { type: "bar" },
				encoding: {
					x: {
						field: "binStart",
					},
					y: {
						field: "filteredCount",
						type: "quantitative",
					},
					fillOpacity: {
						condition: { param: "select", value: 1 },
						value: 0.3,
					},
					strokeWidth: {
						condition: [
							{
								param: "select",
								empty: false,
								value: 2,
							},
							{
								param: "highlight",
								empty: false,
								value: 1,
							},
						],
						value: 0,
					},
				},
			},
		],
	} as VegaLiteSpec;

	const shouldColor = colors.length > 0;
	const topLayerBars = countSpec["layer"][1];
	if (shouldColor) {
		topLayerBars.encoding.color = {
			field: "color",
			type: "nominal",
			scale: null,
			legend: null,
		};
	} else {
		topLayerBars.encoding.color = {
			field: "metricColor",
			type: "nominal",
			scale: null,
			legend: null,
		};
	}

	return countSpec;
}

export function generateHistogramSpec({
	width = 350,
	height = 40,
	colors = [],
	opacity = 0.5,
} = {}) {
	const histogramSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: width,
		height: height,
		layer: [
			{
				params: [
					{
						name: "brush",
						select: { type: "interval", encodings: ["x"] },
					},
				],
				mark: { type: "bar", opacity: opacity, cursor: "col-resize" },
				encoding: {
					x: {
						field: "binStart",
						bin: { binned: true },
					},
					x2: { field: "binEnd" },
					y: {
						field: "count",
						type: "quantitative",
					},
					color: { value: "#ddd" },
				},
			},
			{
				mark: { type: "bar" },
				encoding: {
					size: {
						legend: null,
					},
					x: {
						field: "binStart",
						bin: { binned: true },
						title: "",
						axis: { title: "", labelColor: "rgba(0, 0, 0, 0.6)" },
					},
					x2: { field: "binEnd" },
					y: {
						field: "filteredCount",
						type: "quantitative",
						title: "count",
						axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
					},
				},
			},
		],
	} as VegaLiteSpec;

	const shouldColor = colors.length > 0;
	const topLayerBars = histogramSpec["layer"][1];
	if (shouldColor) {
		topLayerBars.encoding.color = {
			field: "color",
			type: "nominal",
			scale: null,
			legend: null,
		};
	} else {
		topLayerBars.encoding.color = {
			field: "metricColor",
			type: "nominal",
			scale: null,
			legend: null,
		};
	}

	return histogramSpec;
}
