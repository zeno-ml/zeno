<script lang="ts">
	import { mdiArrowDown, mdiSwapVertical } from "@mdi/js";
	import { Icon } from "@smui/button";
	import { Svg } from "@smui/common";
	import Tooltip, { Wrapper } from "@smui/tooltip";
	import { extent } from "d3-array";
	import { scaleLinear, scalePoint } from "d3-scale";
	import { select } from "d3-selection";
	import { line } from "d3-shape";
	import { onMount } from "svelte";
	import { models } from "../stores";
	import type { SliceMetric } from "../zenoservice";
	import { calculateStd, regression } from "./stats";

	let el: HTMLDivElement;
	let width = 80;
	let height = 30;
	let padding = { top: 5, right: 0, bottom: 5, left: 0 };

	export let res: SliceMetric[];

	const xScale = scalePoint()
		.domain($models)
		.range([padding.left, width - padding.right]);
	const yScale = scaleLinear()
		.domain(extent(res.map((r) => r.metric)))
		.range([height - padding.top, padding.bottom]);
	const lineGenerator = line()
		.x((d) => xScale(d))
		.y((d, i) => yScale(res[i].metric));

	const r = regression(res.map((d, i) => [i, d.metric]));
	const detrended = res.map((d, i) => d.metric - r[0] * i - r[1]);
	const variance = calculateStd(detrended);

	onMount(() => {
		select(el)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("path")
			.attr("stroke-linecap", "round")
			.datum($models)
			.attr("d", lineGenerator)
			.attr("stroke", "#6a1b9a")
			.attr("stroke-width", 1.5)
			.attr("fill", "none");
	});
</script>

<div class="inline">
	{#if r[0] < -3}
		<div class="icon">
			<Wrapper>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#b71c1c" d={mdiArrowDown} />
				</Icon>
				<Tooltip xPos="center">regression in performance</Tooltip>
			</Wrapper>
		</div>
	{:else if variance > 6}
		<div class="icon">
			<Wrapper>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#b71c1c" d={mdiSwapVertical} />
				</Icon>
				<Tooltip xPos="center">volatility in performance</Tooltip>
			</Wrapper>
		</div>
	{:else}
		<div style:width="18px" />
	{/if}
	<div
		bind:this={el}
		style:width={width + padding.left + padding.right}
		style:height={height + padding.top + padding.bottom} />
</div>

<style>
	.inline {
		display: flex;
		flex-direction: inline;
		justify-content: center;
		align-items: center;
	}
	.icon {
		width: 18px;
		height: 18px;
		margin-right: 10px;
		cursor: pointer;
	}
</style>
