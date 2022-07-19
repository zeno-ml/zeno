import type { VegaLiteSpec } from "svelte-vega";

export const histogramSpecNotColored = {
	$schema: "https://vega.github.io/schema/vega-lite/v5.json",
	data: {
		name: "table",
	},
	view: {
		stroke: "transparent",
	},
	width: 350,
	height: 40,
	layer: [
		{
			params: [
				{
					name: "brush",
					select: { type: "interval", encodings: ["x"] },
				},
			],
			mark: "bar",
			encoding: {
				x: {
					field: "binStart",
					bin: { binned: true },
				},
				x2: { field: "binEnd" },
				y: {
					field: "count",
					type: "quantitative",
				},
				color: { value: "#ddd" },
			},
		},
		{
			transform: [{ filter: { param: "brush" } }],
			mark: { type: "bar", fill: "#B1B1B1", opacity: 0.9 },
			encoding: {
				size: {
					legend: null,
				},
				x: {
					field: "binStart",
					bin: { binned: true },
					title: "",
					axis: { title: "", labelColor: "rgba(0, 0, 0, 0.6)" },
				},
				x2: { field: "binEnd" },
				y: {
					field: "filteredCount",
					type: "quantitative",
					title: "count",
					axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
				},
			},
		},
	],
} as VegaLiteSpec;
export const histogramSpec = {
	$schema: "https://vega.github.io/schema/vega-lite/v5.json",
	data: {
		name: "table",
	},
	view: {
		stroke: "transparent",
	},
	width: 350,
	height: 40,
	layer: [
		{
			params: [
				{
					name: "brush",
					select: { type: "interval", encodings: ["x"] },
				},
			],
			mark: { type: "bar", fill: "#ededed" },
			encoding: {
				x: {
					field: "binStart",
					bin: { binned: true },
				},
				x2: { field: "binEnd" },
				y: {
					field: "count",
					type: "quantitative",
				},
				color: { value: "#ddd" },
			},
		},
		{
			transform: [{ filter: { param: "brush" } }],
			mark: { type: "bar", opacity: 0.5 },
			encoding: {
				size: {
					legend: null,
				},
				x: {
					field: "binStart",
					bin: { binned: true },
					title: "",
					axis: { title: "", labelColor: "rgba(0, 0, 0, 0.6)" },
				},
				x2: { field: "binEnd" },
				y: {
					field: "filteredCount",
					type: "quantitative",
					title: "count",
					axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
				},
				color: {
					field: "binStart",
					bin: { binned: true },
					legend: null,
					scale: { scheme: "Purples" },
				},
			},
		},
	],
} as VegaLiteSpec;

export const histogramSpec2 = {
	$schema: "https://vega.github.io/schema/vega-lite/v5.json",
	data: {
		name: "table",
	},
	view: {
		stroke: "transparent",
	},
	width: 350,
	height: 40,
	layer: [
		{
			params: [
				{
					name: "brush",
					select: { type: "interval", encodings: ["x"] },
				},
			],
			mark: "bar",
			encoding: {
				x: {
					field: "data",
					bin: { maxbins: 20 },
					axis: {
						title: "",
						grid: false,
						tickCount: 2,
						labelColor: "rgba(0, 0, 0, 0.6)",
					},
				},
				y: {
					aggregate: "sum",
					field: "count",
					axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
				},
			},
		},
		{
			mark: { type: "bar", fill: "#9b51e0", opacity: 0.6 },
			encoding: {
				x: {
					field: "value",
					bin: { maxbins: 20 },
					axis: {
						title: "",
						grid: false,
						tickCount: 2,
						labelColor: "rgba(0, 0, 0, 0.6)",
					},
				},
				y: {
					aggregate: "sum",
					field: "filteredCount",
					axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
				},
			},
		},
		{
			transform: [{ filter: { param: "brush" } }],
			mark: { type: "bar", opacity: 0.5 },
			encoding: {
				color: {
					field: "color",
					scale: { scheme: "purples" },
					legend: null,
				},
				x: {
					field: "value",
					bin: { maxbins: 20 },
				},
				y: { aggregate: "count" },
			},
		},
	],
} as VegaLiteSpec;

export const countSpec = {
	$schema: "https://vega.github.io/schema/vega-lite/v5.json",
	data: {
		name: "table",
	},
	view: {
		stroke: "transparent",
	},
	width: 350,
	height: 40,
	layer: [
		{
			params: [
				{
					name: "highlight",
					select: { type: "point", on: "mouseover" },
				},
				{ name: "select", select: { type: "point", encodings: ["x"] } },
			],
			mark: { type: "bar", fill: "#9b51e0", opacity: 0.3 },
			encoding: {
				x: {
					field: "value",
					type: "ordinal",
					axis: {
						title: "",
						grid: false,
						tickCount: 2,
						labelColor: "rgba(0, 0, 0, 0.6)",
					},
				},
				y: {
					aggregate: "sum",
					field: "filteredCount",
					axis: { title: "", tickCount: 2, labelColor: "rgba(0, 0, 0, 0.6)" },
				},
			},
		},
	],
} as VegaLiteSpec;
