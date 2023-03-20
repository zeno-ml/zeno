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
		description: "A simple line chart with embedded data.",
		width: {
			step: 150,
		},
		data: {
			name: "table",
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
			color: {
				condition: {
					param: "hover",
					field: color_encode,
					scale: { scheme: "category20" },
					sort: null,
				},
				value: "grey",
			},
			opacity: { condition: { param: "hover", value: 1 }, value: 0.1 },
		},

		layer: [
			{
				params: [
					{
						name: "hover",
						select: {
							type: "point",
							fields: [color_encode],
							on: "mouseover",
						},
					},
				],
				mark: {
					type: "circle",
					size: 100,
					tooltip: {
						signal:
							"{'slice_name': datum.slices, 'size': datum.size, 'metric': datum.metrics, 'model': datum.models}",
					},
				},
			},
			{
				mark: {
					type: "line",
				},
			},
			{
				transform: [{ filter: { param: "hover", empty: false } }],
				mark: {
					type: "text",
					style: "label",
				},
				encoding: {
					text: {
						field: y_encode,
						type: paramMap[y_encode].type,
					},
					color: { value: "black" },
				},
			},
		],
		config: {
			style: { label: { dy: -13, dx: -2 } },
		},
	};

	return spec as VegaLiteSpec;
}
