import type { VisualizationSpec } from "vega-embed";

export const generateSpec: VisualizationSpec = {
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
					update: "datum.category",
				},
				{
					events: "@category-line:mouseout",
					update: "{}",
				},
				{
					events: "@value-text:mouseover",
					update: "datum.datum.category",
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
					groupby: ["key"],
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
			domain: { data: "table", field: "key" },
		},
		{
			name: "radial",
			type: "linear",
			range: { signal: "[0, radius]" },
			zero: true,
			nice: false,
			domain: { data: "table", field: "value" },
		},
		{
			name: "color",
			type: "ordinal",
			domain: { data: "table", field: "category" },
			range: { scheme: "category10" },
		},
	],
	legends: [
		{
			fill: "color",
			orient: "none",
			title: "Layer",
			encode: {
				legend: { update: { x: { value: 300 }, y: { value: -250 } } },
			},
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
				facet: { data: "table", name: "facet", groupby: ["category"] },
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
									"scale('radial', datum.value) * cos(scale('angular', datum.key))",
							},
							y: {
								signal:
									"scale('radial', datum.value) * sin(scale('angular', datum.key))",
							},
						},
						update: {
							stroke: [
								{ test: "datum.category === hover", value: "black" },
								{ scale: "color", field: "category" },
							],
							strokeWidth: [
								{ test: "datum.category === hover", value: 2 },
								{ value: 1 },
							],
							strokeOpacity: [
								{ test: "datum.category === hover", value: 0.8 },
								{ value: 0.4 },
							],
							fill: { scale: "color", field: "category" },
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
							x: { signal: "datum.x" },
							y: { signal: "datum.y" },
						},
						update: {
							align: { value: "center" },
							baseline: { value: "middle" },
							text: { signal: "datum.datum.value" },
							fill: { value: "black" },
							fontSize: [
								{ test: "datum.datum.category === hover", value: 13 },
								{ value: 12 },
							],
							fontWeight: { value: "bold" },
							fillOpacity: [
								{ test: "datum.datum.category === hover", value: 1 },
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
					x2: { signal: "radius * cos(scale('angular', datum.key))" },
					y2: { signal: "radius * sin(scale('angular', datum.key))" },
					stroke: { value: "gray" },
					strokeWidth: { value: 2 },
					strokeOpacity: { value: 0.2 },
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
					x: { signal: "(radius + 5) * cos(scale('angular', datum.key))" },
					y: { signal: "(radius + 5) * sin(scale('angular', datum.key))" },
					text: { field: "key" },
					align: [
						{
							test: "abs(scale('angular', datum.key)) > PI / 2",
							value: "right",
						},
						{
							value: "left",
						},
					],
					baseline: [
						{
							test: "scale('angular', datum.key) > 0",
							value: "top",
						},
						{
							test: "scale('angular', datum.key) == 0",
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
	],
};
