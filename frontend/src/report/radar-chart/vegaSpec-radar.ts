import type { VisualizationSpec } from "vega-embed";

export default function generateSpec(parameters): VisualizationSpec {
	const x_encode = parameters.xEncoding;
	const y_encode = parameters.yEncoding;
	const color_encode = parameters.colorEncoding;
	const datum_x = "datum." + x_encode;
	const datum_y = "datum." + y_encode;
	const datum_color = "datum." + color_encode;

	const spec = {
		$schema: "https://vega.github.io/schema/vega/v5.json",
		description:
			"A radar chart example, showing multiple dimensions in a radial layout.",
		autosize: { type: "none", contains: "padding" },
		padding: { left: 80, right: 60, top: 60, bottom: 100 },

		signals: [
			{ name: "radius", update: "width / 2.3" },
			{
				name: "hover",
				value: {},
				on: [
					{
						events: "@category-line:mouseover",
						update: datum_color,
					},
					{
						events: "@category-line:mouseout",
						update: "{}",
					},
					{
						events: "@value-text:mouseover",
						update: "datum." + datum_color,
					},
					{
						events: "@value-text:mouseout",
						update: "{}",
					},
				],
			},
		],

		data: [
			{ name: "table" },
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
		legends: [
			{
				type: "symbol",
				title: "Color",
				fill: "color",
				direction: "horizontal",
				orient: "top",
				offset: 130,
				titleFontSize: 12,
				labelFontSize: 12,
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
				zindex: 0.5,
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
							},
							update: {
								stroke: [
									{ test: datum_color + "=== hover", value: "black" },
									{ scale: "color", field: color_encode },
								],
								strokeWidth: [
									{ test: datum_color + "=== hover", value: 2 },
									{ value: 1 },
								],
								strokeOpacity: [
									{ test: datum_color + "=== hover", value: 0.8 },
									{ value: 0.4 },
								],
								fill: { scale: "color", field: color_encode },
								fillOpacity: { value: 0.2 },
							},
						},
					},
					{
						type: "text",
						name: "value-text",
						from: { data: "category-line" },
						encode: {
							enter: {
								x: { field: "x" },
								y: { field: "y" },
							},
							update: {
								align: { value: "center" },
								baseline: { value: "middle" },
								text: { signal: "datum." + datum_y },
								fill: { value: "black" },
								fontSize: [
									{ test: "datum." + datum_color + "=== hover", value: 13 },
									{ value: 12 },
								],
								fontWeight: { value: "bold" },
								fillOpacity: [
									{ test: "datum." + datum_color + "=== hover", value: 1 },
									{ value: 0.4 },
								],
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
						strokeOpacity: { value: 0.7 },
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
							signal: "(radius + 15) * cos(scale('angular', " + datum_x + "))",
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
						fontSize: { value: 12 },
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
						strokeOpacity: { value: 0.7 },
					},
				},
			},
		],
	};
	return spec as VisualizationSpec;
}
