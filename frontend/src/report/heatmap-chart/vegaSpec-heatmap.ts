import type { VegaLiteSpec } from "svelte-vega";

export default function generateSpec(parameters, selectMetrics): VegaLiteSpec {
	const x_encode = parameters.xEncoding;
	const y_encode = parameters.yEncoding;
	const paramMap = {
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
		transform: [
			{
				joinaggregate: [
					{
						op: "average",
						field: selectMetrics !== "slice size" ? "metrics" : "size",
						as: "mean_metrics",
					},
				],
			},
		],
		encoding: {
			x: {
				title: paramMap[x_encode].title,
				field: x_encode,
				type: paramMap[x_encode].type,
				axis: {
					labelAngle: -20,
					labelFontSize: 14,
					titleFontSize: 14,
					orient: "top",
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
		},
		layer: [
			{
				params: [
					{
						name: "hover",
						select: {
							type: "point",
							field: selectMetrics !== "slice size" ? "metrics" : "size",
							on: "mouseover",
						},
					},
				],
				mark: {
					type: "rect",
					tooltip: {
						signal:
							"{'slice_name': datum.slices,'slice_size': datum.size, " +
							(selectMetrics !== "slice size" ? selectMetrics : "accuracy") +
							": datum.metrics, 'model': datum.models}",
					},
				},
				encoding: {
					color: {
						title: selectMetrics,
						field: selectMetrics !== "slice size" ? "metrics" : "size",
						type: "quantitative",
						scale: { scheme: "purples" },
					},
					fillOpacity: {
						condition: [
							{
								param: "hover",
								empty: false,
								value: 1,
							},
						],
						value: 0.7,
					},
				},
			},
			{
				mark: { type: "text", fontSize: 12 },
				encoding: {
					text: {
						field: selectMetrics !== "slice size" ? "metrics" : "size",
						type: "quantitative",
						format: ".2f",
					},
					color: {
						condition: {
							test:
								selectMetrics !== "slice size"
									? "datum.metrics < datum.mean_metrics"
									: "datum.size < datum.mean_metrics",
							value: "black",
						},
						value: "white",
					},
				},
			},
		],
		config: {
			rect: { cornerRadius: 5 },
			axis: { ticks: false, labelPadding: 15, domain: false },
			view: {
				strokeWidth: 0,
				step: 70,
			},
		},
	};
	return spec as VegaLiteSpec;
}
