import type { VegaLiteSpec } from "svelte-vega";

export default function generateBarSpec(metric, model) {
	const spec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		description: "A simple bar chart with embedded data.",
		autosize: "fit",
		width: {
			step: 30,
		},
		data: {
			name: "table",
		},
		mark: {
			type: "bar",
			fill: "#6a1a9a",
		},
		title: model,
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
		},
	} as VegaLiteSpec;

	spec.encoding.y.title = metric;

	return spec;
}
