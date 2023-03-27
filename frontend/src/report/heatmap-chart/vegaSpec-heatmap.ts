import type { VegaLiteSpec } from "svelte-vega";

export default function generateSpec(parameters, selectMetrics): VegaLiteSpec {
	const x_encode = parameters.xEncoding;
	const y_encode = parameters.yEncoding;
	const color_encode = parameters.colorEncoding;
	const paramMap = {
		metrics: {
			type: "quantitative",
			title: selectMetrics,
		},
		models: {
			type: "nominal",
			title: "models",
		},
		slices: {
			type: "nominal",
			title: "slices",
		},
	};
	const spec = {
		$schema: "https://vega.github.io/schema/vega-lite/v5.json",
		autosize: "fit",
		data: {
			name: "table",
		},
		mark: "rect",
		encoding: {
			x: {
				title: paramMap[x_encode].title,
				field: x_encode,
				type: paramMap[x_encode].type,
				axis: {
					labelAngle: 45,
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10,
				},
			},
			y: {
				title: paramMap[y_encode].title,
				field: y_encode,
				type: paramMap[y_encode].type,
				axis: {
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10,
				},
			},
			color: {
				title: paramMap[color_encode].title,
				field: color_encode,
				type: paramMap[color_encode].type,
				scale: { scheme: "purples" },
			},
		},
		config: {
			axis: { ticks: false, labelPadding: 15, domain: false },
			view: {
				strokeWidth: 0,
				step: 60,
			},
		},
	};
	return spec as VegaLiteSpec;
}
