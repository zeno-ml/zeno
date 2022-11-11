import type { VegaLiteSpec } from "svelte-vega";

export default function generateLineSpec(metric) {
	const spec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		description: "A simple line chart with embedded data.",
		autosize: "fit",
		width: {
			step: 30,
		},
		data: {
			name: "table",
		},
		mark: {
			type: "line",
		},
		encoding: {
			x: {
				field: "slice",
				type: "nominal",
				axis: {
					labelAngle: 45,
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10,
				},
				sort: "-metric",
			},
			y: {
				field: "metric",
				type: "quantitative",
				axis: { labelFontSize: 14, titleFontSize: 14, titlePadding: 10 },
				labelFontSize: 14,
			},
			xOffset: { field: "model" },
			color: { field: "model" },
		},
	} as VegaLiteSpec;

	spec.encoding.y.title = metric;

	return spec;
}
