<script lang="ts">
	import NoEmbed from "./NoEmbed.svelte";
	import ReglScatter from "./regl-scatter/ReglScatter.svelte";
	import ScatterHelp from "./ScatterHelp.svelte";
	import ScatterLegend from "./ScatterLegend.svelte";
	import ScatterSettings from "./ScatterSettings.svelte";

	import { BarLoader as Spinner } from "svelte-loading-spinners";
	import { createViewComponent } from "../instance-views";
	import {
		model,
		selectionIds,
		selectionPredicates,
		status,
		globalColorByColumn,
	} from "../../stores";
	import { createScalesWebgGLExtent } from "./regl-scatter";

	import { tick } from "svelte";
	import {
		ZenoService,
		type Points2D,
		type ZenoColumn,
	} from "../../zenoservice";
	import type {
		ReglScatterPointDispatch,
		WebGLExtentScalers,
	} from "./regl-scatter";
	import {
		deselectPoints,
		getIndicesFromIds,
		getPointOpacities,
		selectPoints,
	} from "./scatter";

	export let viewFunction;
	export let viewOptions = {};
	export let autoResize = true;

	const hoverViewOffset = 10;
	let height = 850; // canvas dims
	let width = 1000; // canvas dims
	let pointSizeSlider = 3;
	let embedExists = false;
	let points: Points2D;
	let computingPoints = false; // spinner when true
	let pointOpacities: number[] = [];
	// column to color scatterplot by
	let runOnce = false;
	let mounted = false;
	let reloadedIndices: number[] = [];

	let pointToWebGL: WebGLExtentScalers; // functions to scale points
	let pointHover: ReglScatterPointDispatch;
	let hoverViewDivEl: HTMLDivElement; // show view on point hover
	let containerEl: HTMLDivElement; // save for resizing

	// Regl Scatterplot functions for highlighting points
	let dehighlightPoints;
	let highlightPoints;

	// if no coloring, just do the first one we have
	$: if ($globalColorByColumn === null) {
		globalColorByColumn.set($status.completeColumns[0]);
	}
	$: project2DOnModelChange($model);
	$: changePointsColorsOnColorChange($globalColorByColumn);
	$: {
		if (containerEl && autoResize) {
			resizeScatter();
		}
	}
	$: if ($selectionIds.ids.length === 0 && dehighlightPoints) {
		dehighlightPoints();
	}

	$: if (points) {
		getPointOpacities($selectionPredicates, points).then(
			(filteredOpacities) => {
				pointOpacities = filteredOpacities;
			}
		);
	}

	$: if (points && !runOnce && mounted) {
		rehighlightSelectedPoints();
		runOnce = true;
	}

	async function rehighlightSelectedPoints() {
		reloadedIndices = getIndicesFromIds(points.ids, $selectionIds.ids);
		await tick();
		highlightPoints(reloadedIndices);
	}

	/**
	 * Updates only the colors on color change
	 */
	async function changePointsColorsOnColorChange(colorByColumn: ZenoColumn) {
		if (pointsExist(points)) {
			const newPointColors = await ZenoService.getProjectionColors({
				column: colorByColumn,
			});

			// update the colors and leave x, y alone
			points.color = newPointColors.color;
			points.domain = newPointColors.domain;
			points.dataType = newPointColors.dataType;
		}
	}

	/**
	 * Main driver behind fetching the projected points and displaying
	 * them in the scale that WebGL expects between [-1, 1]
	 */
	async function project2DOnModelChange(model: string) {
		embedExists = await ZenoService.embedExists(model);

		if (embedExists) {
			// show spinner
			computingPoints = true;

			// requests tsne from backend
			points = await ZenoService.projectEmbedInto2D({
				model,
				column: $globalColorByColumn,
			});

			// simply scales the points between [-1, 1]
			pointToWebGL = createScalesWebgGLExtent(points);
			pointToWebGL.scale(points);

			// stop spinner
			computingPoints = false;
		}
	}

	/**
	 * Shows the instance view of the current hovering point
	 * on top of the scatterplot by globally updating hoverViewDivEl
	 * and receiving mouseinfo from ReglScatterplot
	 */
	async function showViewOnPoint(e: CustomEvent<ReglScatterPointDispatch>) {
		pointHover = e.detail;
		const id = points.ids[pointHover.index];

		// fetch the row from the backend given that Id
		const entry = await ZenoService.getDfRowEntry({ id });

		// create the data view component and replace the div with the new component
		createViewComponent(
			viewFunction,
			JSON.parse(entry),
			viewOptions,
			hoverViewDivEl
		);
	}

	function clearPointHover() {
		pointHover = undefined;
	}

	function resizeScatter() {
		if (containerEl && autoResize) {
			width = containerEl.clientWidth;
		}
	}

	function pointsExist(points: Points2D) {
		return points && "ids" in points && points.ids.length > 0;
	}
</script>

<svelte:window on:resize={resizeScatter} />

<div id="scatter-view" bind:clientHeight={height}>
	{#if embedExists}
		<div bind:this={containerEl} id="container">
			{#if !computingPoints}
				<!-- highlight hovering point with circle outline  -->
				<svg class="background" {width} {height}>
					{#if pointHover !== undefined}
						<circle
							cx={pointHover.canvasX}
							cy={pointHover.canvasY}
							r={15}
							fill="none"
							stroke="lavender" />
					{/if}
				</svg>

				<!-- Scatterplot and overlay instance on top of nearest point -->
				{#if points}
					<div class="overlay">
						<ReglScatter
							style="outline: 1px solid lavender"
							data={{
								...points,
								opacity: pointOpacities,
							}}
							pointSize={pointSizeSlider}
							pointColor="#6a1b9a"
							{width}
							{height}
							on:pointOver={showViewOnPoint}
							on:pointOut={clearPointHover}
							on:select={(e) => selectPoints(e, points)}
							on:deselect={deselectPoints}
							on:mount={(e) => {
								const reglScatterplot = e.detail;
								dehighlightPoints = reglScatterplot.deselect;
								highlightPoints = reglScatterplot.select;
								mounted = true;
							}} />
						{#if pointHover !== undefined}
							<div
								id="hover-view"
								class="no-text-highlight"
								style:left="{pointHover.canvasX + hoverViewOffset}px"
								style:top="{pointHover.canvasY + hoverViewOffset}px">
								<div id="replace-view" bind:this={hoverViewDivEl} />
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<!--  Loading bar -->
				<div id="loading-container">
					<div id="loading-indicator" style:color="#6a1b9a">
						<Spinner color="#6a1b9a" size={80} />
						<b>Computing 2D projection</b> from
						<code>
							{$model}
						</code> embeddings
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<NoEmbed />
	{/if}

	<!-- settings/controls for the scatterplot -->
	<div id="settings" class="frosted">
		<ScatterSettings
			bind:colorByColumn={$globalColorByColumn}
			bind:pointSizeSlider />
	</div>
	{#if points}
		<div id="legend" class="frosted">
			<ScatterLegend domain={points.domain} metadataType={points.dataType} />
		</div>
	{/if}

	<!-- extra hints like interactions -->
	<ScatterHelp />
</div>

<style>
	#scatter-view {
		position: relative;
		height: calc(100vh - 170px);
	}
	#loading-container {
		height: calc(100vh - 170px);
	}
	#container {
		position: relative;
		width: auto;
		height: auto;
	}
	#hover-view {
		position: absolute;
		z-index: 2;
	}

	.overlay {
		position: relative;
		z-index: 1;
	}
	.background {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 0;
	}
	.frosted {
		background: hsla(0, 0%, 95%, 0.3);
		backdrop-filter: blur(8px);
	}
	#legend {
		position: absolute;
		bottom: 10px;
		left: 10px;
		z-index: 2;
		padding: 30px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 30%, 0.1);
		border-radius: 3px;
	}
	#settings {
		position: absolute;
		bottom: 10px;
		right: 10px;
		width: 300px;
		z-index: 2;
		padding-left: 20px;
		padding-top: 20px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 30%, 0.1);
		border-radius: 3px;
	}

	/* https://stackoverflow.com/questions/826782/how-to-disable-text-selection-highlighting */
	.no-text-highlight {
		-webkit-touch-callout: none; /* iOS Safari */
		-webkit-user-select: none; /* Safari */
		-khtml-user-select: none; /* Konqueror HTML */
		-moz-user-select: none; /* Old versions of Firefox */
		-ms-user-select: none; /* Internet Explorer/Edge */
		user-select: none; /* Non-prefixed version, currently supported by Chrome, Edge, Opera and Firefox */
	}
</style>
