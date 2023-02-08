import type { VegaLiteSpec } from "svelte-vega";

export default function generateBarSpec(metric): VegaLiteSpec {
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
		},
		encoding: {
			x: {
				field: "slice",
				type: "nominal",
				axis: {
					labelAngle: 45,
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10
				},
			},
			y: {
				title: "",
				field: "metric",
				type: "quantitative",
				axis: {
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10
				},
				labelFontSize: 14,
			},
			xOffset: {
				field: "model",
				sort: "model"
			},
			color: {
				field: "model",
				sort: "model"
			},
		},
	};

	spec.encoding.y.title = metric;

	return spec as VegaLiteSpec;
}
