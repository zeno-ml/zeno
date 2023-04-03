import type { VisualizationSpec } from "vega-embed";
export default function generateSpec(parameters, xLabel): VisualizationSpec {
	const x_encode = parameters.xEncoding;
	const color_encode = parameters.colorEncoding;

	const paramMap = {
		models: {
			type: "nominal",
			title: "Model Color",
		},
		slices: {
			type: "nominal",
			title: "Slice Color",
		},
	};

	const spec = {
		$schema: "https://vega.github.io/schema/vega/v5.json",
		description:
			"A beeswarm chart example that uses a force-directed layout to group items by category.",
		width: 600,
		height: 100,
		padding: { left: 5, right: 5, top: 0, bottom: 20 },
		autosize: "pad",

		signals: [
			{ name: "cx", update: "width / 2" },
			{ name: "cy", update: "height / 2" },
			{
				name: "radius",
				value: 10,
			},
			{
				name: "collide",
				value: 1,
			},
			{ name: "gravityX", value: 0.2 },
			{ name: "gravityY", value: 0.1 },
			{ name: "static", value: true },
		],

		data: [
			{
				name: "table",
			},
		],

		scales: [
			{
				name: "xscale",
				domain: {
					data: "table",
					field: xLabel !== "size" ? x_encode : "size",
				},
				range: "width",
				nice: true,
				zero: false,
			},
			{
				name: "sizescale",
				domain: {
					data: "table",
					field: "size",
				},
				range: [80, 800],
			},
			{
				name: "color",
				type: "ordinal",
				domain: { data: "table", field: color_encode },
				range: { scheme: "category20" },
			},
		],

		axes: [
			{
				title: xLabel,
				titleFontSize: 12,
				orient: "bottom",
				scale: "xscale",
			},
		],

		legends: [
			{
				type: "symbol",
				title: paramMap[color_encode].title,
				fill: "color",
			},
		],

		marks: [
			{
				name: "nodes",
				type: "symbol",
				from: { data: "table" },
				encode: {
					enter: {
						fill: { scale: "color", field: color_encode },
						xfocus: {
							scale: "xscale",
							field: xLabel !== "size" ? x_encode : "size",
							band: 0.5,
						},
						yfocus: { signal: "cy" },
					},
					update: {
						size: { scale: "sizescale", field: "size" },
						stroke: { value: "white" },
						strokeWidth: { value: 1 },
						zindex: { value: 0 },
					},
					hover: {
						stroke: { value: "black" },
						strokeWidth: { value: 3 },
						zindex: { value: 1 },
						tooltip: {
							signal:
								"{'slice_name': datum.slices,'size': datum.size, " +
								(xLabel !== "size" ? xLabel : "accuracy") +
								": datum.metrics, 'model': datum.models}",
						},
					},
				},
				transform: [
					{
						type: "force",
						iterations: 300,
						static: { signal: "static" },
						forces: [
							{
								force: "collide",
								iterations: { signal: "collide" },
								radius: { signal: "radius" },
							},
							{ force: "x", x: "xfocus", strength: { signal: "gravityX" } },
							{ force: "y", y: "yfocus", strength: { signal: "gravityY" } },
						],
					},
				],
			},
		],
	};

	return spec as VisualizationSpec;
}
