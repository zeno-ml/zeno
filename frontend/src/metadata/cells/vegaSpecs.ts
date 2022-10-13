import type { VegaLiteSpec } from "svelte-vega";

export function generateCountSpec(shouldColor, domain, metricRange) {
	const countSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: 350,
		height: 40,
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
					opacity: 0.5,
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

	const topLayerBars = countSpec["layer"][1];
	if (domain[0].color && shouldColor) {
		topLayerBars.encoding.color = {
			field: "color",
			type: "nominal",
			scale: null,
			legend: null,
		};
	} else {
		topLayerBars.encoding.color = {
			field: "metric",
			type: "quantitative",
			scale: {
				domainMin: metricRange[0],
				domainMax: metricRange[1],
				range: ["#decbe9", "#6a1b9a"],
			},
			legend: null,
		};
	}

	return countSpec;
}

export function generateHistogramSpec(shouldColor, domain, metricRange) {
	const histogramSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: 350,
		height: 40,
		layer: [
			{
				params: [
					{
						name: "brush",
						select: { type: "interval", encodings: ["x"] },
					},
				],
				mark: { type: "bar", opacity: 0.5, cursor: "col-resize" },
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
						axis: {
							title: "",
							tickCount: 2,
							labelColor: "rgba(0, 0, 0, 0.6)",
						},
					},
				},
			},
		],
	} as VegaLiteSpec;

	const topLayerBars = histogramSpec["layer"][1];
	if (domain[0].color && shouldColor) {
		topLayerBars.encoding.color = {
			field: "color",
			type: "nominal",
			scale: null,
			legend: null,
		};
	} else {
		// if (domain[0].metricColor && domain[0].metricColor !== "#000000") {
		topLayerBars.encoding.color = {
			field: "metric",
			type: "quantitative",
			scale: {
				domainMin: metricRange[0],
				domainMax: metricRange[1],
				range: ["#decbe9", "#6a1b9a"],
			},
			legend: null,
		};
	}
	// } else {
	// 	topLayerBars.mark.fill = "#6a1b9a";
	// }

	return histogramSpec;
}
