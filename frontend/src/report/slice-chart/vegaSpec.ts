import type { VegaLiteSpec } from "svelte-vega";

export default function generateBarSpec(
	parameters,
	selectMetrics
): VegaLiteSpec {
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
				title: paramMap[x_encode].title,
				field: x_encode,
				type: paramMap[x_encode].type,
				axis: {
					labelAngle: 45,
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10,
				},
				sort: null,
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
				sort: null,
			},
			xOffset: {
				field: color_encode,
				sort: null,
			},
			yOffset: {
				field: color_encode,
				sort: null,
			},
			color: {
				field: color_encode,
				sort: null,
			},
		},
	};

	return spec as VegaLiteSpec;
}
