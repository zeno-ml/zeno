import type { VegaLiteSpec } from "svelte-vega";

export default function generateSpec(parameters, selectMetrics): VegaLiteSpec {
	const x_encode = parameters.xEncoding;
	const y_encode = parameters.yEncoding;
	const z_encode = parameters.zEncoding;
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
		padding: { top: 20 },
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
				field: selectMetrics !== "slice size" ? y_encode : "size",
				type: paramMap[y_encode].type,
				axis: {
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 20,
				},
				sort: null,
			},
			color: {
				condition: {
					param: "hover",
					field: z_encode,
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
							fields: [z_encode],
							on: "mouseover",
						},
					},
				],
				mark: {
					type: "circle",
					size: 100,
					tooltip: {
						signal:
							"{'slice_name': datum.slices,'slice_size': datum.size, " +
							(selectMetrics !== "slice size" ? selectMetrics : "accuracy") +
							": datum.metrics, 'model': datum.models}",
					},
				},
			},
			{
				params: [
					{
						name: "hover_line",
						select: {
							type: "point",
							fields: [z_encode],
							on: "mouseover",
						},
					},
				],
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
						field: selectMetrics !== "slice size" ? y_encode : "size",
						type: paramMap[y_encode].type,
					},
					color: { value: "black" },
					format: paramMap[y_encode].type === "quantitative" ? ".2f" : "",
				},
			},
		],
		config: {
			style: { label: { dy: -13, dx: -2 } },
		},
	};

	return spec as VegaLiteSpec;
}
