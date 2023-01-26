import type { VegaLiteSpec } from "svelte-vega";

export function nominalVegaSpec(metricRange) {
	const countSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: 300,
		height: 40,
		layer: [
			{
				params: [
					{ name: "select", select: { type: "point", encodings: ["x"] } },
				],
				mark: {
					type: "bar",
					binSpacing: 0,
					opacity: 0.5,
					fill: "#ddd",
					cursor: "pointer",
				},
				encoding: {
					x: {
						field: "bucket",
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
				mark: { type: "bar", binSpacing: 0 },
				encoding: {
					x: {
						field: "bucket",
					},
					y: {
						field: "filteredCount",
						type: "quantitative",
					},
				},
			},
		],
	} as VegaLiteSpec;

	const topLayerBars = countSpec["layer"][1];
	if (metricRange[0] !== Infinity) {
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
	} else {
		topLayerBars.encoding.color = {
			value: "#6a1b9a",
		};
	}

	return countSpec;
}

export function continuousVegaSpec(metricRange) {
	const histogramSpec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		data: {
			name: "table",
		},
		view: {
			stroke: "transparent",
		},
		width: 300,
		height: 40,
		layer: [
			{
				params: [
					{
						name: "brush",
						select: { type: "interval", encodings: ["x"] },
					},
				],
				mark: {
					type: "bar",
					opacity: 0.5,
					cursor: "col-resize",
					binSpacing: 0,
				},
				encoding: {
					x: {
						field: "bucket",
						bin: { binned: true },
					},
					x2: { field: "bucketEnd" },
					y: {
						field: "count",
						type: "quantitative",
					},
					color: { value: "#ddd" },
				},
			},
			{
				mark: {
					type: "bar",
					binSpacing: 0,
				},
				encoding: {
					size: {
						legend: null,
					},
					x: {
						field: "bucket",
						bin: { binned: true },
						title: "",
						axis: { title: "", labelColor: "rgba(0, 0, 0, 0.6)" },
					},
					x2: { field: "bucketEnd" },
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
	if (metricRange[0] !== Infinity) {
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
	} else {
		topLayerBars.encoding.color = {
			value: "#6a1b9a",
		};
	}

	return histogramSpec;
}
