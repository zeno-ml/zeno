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
		description: "A simple bar chart with embedded data.",
		autosize: "fit",
		width: {
			step: 30,
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
				field: selectMetrics !== "size" ? y_encode : "size",
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
			fillOpacity: {
				condition: { param: "highlight", value: 1, empty: false },
				value: 0.8,
			},
		},
		layer: [
			{
				params: [
					{
						name: "highlight",
						select: {
							type: "point",
							field: y_encode,
							on: "mouseover",
						},
					},
				],
				mark: {
					type: "bar",
					tooltip: {
						signal:
							"{'slice_name': datum.slices,'size': datum.size, " +
							(selectMetrics !== "size" ? selectMetrics : "accuracy") +
							": datum.metrics, 'model': datum.models}",
					},
				},
				encoding: {
					color: {
						field: color_encode,
						sort: null,
						scale: { scheme: "category20" },
					},
				},
			},
			{
				mark: {
					type: "text",
					style: "label",
				},
				encoding: {
					text: {
						field: selectMetrics !== "size" ? y_encode : "size",
						type: paramMap[y_encode].type,
					},
				},
			},
		],
		config: {
			style: { label: { align: "center", dy: -5 } },
		},
	};

	return spec as VegaLiteSpec;
}
