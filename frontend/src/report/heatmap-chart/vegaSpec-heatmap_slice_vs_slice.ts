import type { VegaLiteSpec } from "svelte-vega";

export default function generateSliceVsSliceSpec(selectMetrics): VegaLiteSpec {
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
				title: "slices",
				field: "slice_1",
				type: "nominal",
				axis: {
					labelAngle: -20,
					labelFontSize: 14,
					titleFontSize: 14,
					titlePadding: 10,
					orient: "top",
				},
				sort: null,
			},
			y: {
				title: "slices",
				field: "slice_2",
				type: "nominal",
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
							field: "metrics",
							on: "mouseover",
						},
					},
				],
				mark: {
					type: "rect",
					tooltip: {
						signal:
							"{'slice': datum.slice_1 + ' & ' + datum.slice_2,'slice_size': datum.size, " +
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
