import type { VisualizationSpec } from "vega-embed";

export default function generateSpec(
	parameters,
	selectMetrics
): VisualizationSpec {
	const x_encode = parameters.xEncoding;
	const y_encode = parameters.yEncoding;
	const color_encode = parameters.colorEncoding;
	const datum_x = "datum." + x_encode;
	const datum_y = "datum." + y_encode;

	const spec = {
		$schema: "https://vega.github.io/schema/vega/v5.json",
		description:
			"A radar chart example, showing multiple dimensions in a radial layout.",
		signals: [{ name: "radius", update: "width / 2" }],
		autosize: { type: "none", contains: "padding" },
		title: selectMetrics,
		padding: 70,
		data: [
			{
				name: "table",
			},
			{
				name: "points",
				source: "table",
				transform: [
					{
						type: "aggregate",
						groupby: [x_encode],
					},
				],
			},
		],

		scales: [
			{
				name: "angular",
				type: "point",
				range: { signal: "[-PI, PI]" },
				padding: 0.5,
				domain: { data: "table", field: x_encode },
			},
			{
				name: "radial",
				type: "linear",
				range: { signal: "[0, radius]" },
				zero: true,
				nice: false,
				domain: { data: "table", field: y_encode },
				domainMin: 0,
			},
			{
				name: "color",
				type: "ordinal",
				domain: { data: "table", field: color_encode },
				range: { scheme: "category10" },
			},
		],

		encode: {
			enter: {
				x: { signal: "radius" },
				y: { signal: "radius" },
			},
		},

		marks: [
			{
				type: "group",
				name: "categories",
				zindex: 1,
				from: {
					facet: { data: "table", name: "facet", groupby: [color_encode] },
				},
				marks: [
					{
						type: "line",
						name: "category-line",
						from: { data: "facet" },
						encode: {
							enter: {
								interpolate: { value: "linear-closed" },
								x: {
									signal:
										"scale('radial'," +
										datum_y +
										")*cos(scale('angular'," +
										datum_x +
										"))",
								},
								y: {
									signal:
										"scale('radial'," +
										datum_y +
										")*sin(scale('angular'," +
										datum_x +
										"))",
								},
								stroke: { scale: "color", field: color_encode },
								strokeWidth: { value: 2 },
								fill: { scale: "color", field: color_encode },
								fillOpacity: { value: 0.1 },
							},
						},
					},
					{
						type: "text",
						name: "value-text",
						from: { data: "category-line" },
						encode: {
							enter: {
								x: { signal: "datum.x" },
								y: { signal: "datum.y" },
								text: { signal: "datum." + datum_y },
								align: { value: "center" },
								baseline: { value: "middle" },
								fill: { value: "black" },
							},
						},
					},
				],
			},
			{
				type: "rule",
				name: "radial-grid",
				from: { data: "points" },
				zindex: 0,
				encode: {
					enter: {
						x: { value: 0 },
						y: { value: 0 },
						x2: { signal: "radius * cos(scale('angular', " + datum_x + "))" },
						y2: { signal: "radius * sin(scale('angular', " + datum_x + "))" },
						stroke: { value: "lightgray" },
						strokeWidth: { value: 2 },
					},
				},
			},
			{
				type: "text",
				name: "key-label",
				from: { data: "points" },
				zindex: 1,
				encode: {
					enter: {
						x: {
							signal: "(radius + 5) * cos(scale('angular', " + datum_x + "))",
						},
						y: {
							signal: "(radius + 5) * sin(scale('angular', " + datum_x + "))",
						},
						text: { field: x_encode },
						align: [
							{
								test: "abs(scale('angular', " + datum_x + ")) > PI / 2",
								value: "right",
							},
							{
								value: "left",
							},
						],
						baseline: [
							{
								test: "scale('angular', " + datum_x + ") > 0",
								value: "top",
							},
							{
								test: "scale('angular', " + datum_x + ") == 0",
								value: "middle",
							},
							{
								value: "bottom",
							},
						],
						fill: { value: "black" },
						fontWeight: { value: "bold" },
					},
				},
			},
			{
				type: "line",
				name: "outer-line",
				from: { data: "radial-grid" },
				encode: {
					enter: {
						interpolate: { value: "linear-closed" },
						x: { field: "x2" },
						y: { field: "y2" },
						stroke: { value: "lightgray" },
						strokeWidth: { value: 2 },
					},
				},
			},
		],
	};
	return spec as VisualizationSpec;
}
