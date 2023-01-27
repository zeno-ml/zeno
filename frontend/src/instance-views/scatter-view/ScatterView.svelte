<script lang="ts">
	import NoEmbed from "./NoEmbed.svelte";
	import ReglScatter from "./regl-scatter/ReglScatter.svelte";
	import ScatterHelp from "./ScatterHelp.svelte";
	import ScatterSettings from "./ScatterSettings.svelte";
	import ScatterLegend from "./ScatterLegend.svelte";

	import { BarLoader as Spinner } from "svelte-loading-spinners";
	import {
		checkEmbedExists,
		createViewComponent,
		getEntry,
		projectEmbedInto2D,
	} from "../../api/api";
	import { getFilteredIds } from "../../api/table";
	import {
		model,
		selectionIds,
		selectionPredicates,
		status,
	} from "../../stores";
	import { createScalesWebgGLExtent } from "./regl-scatter";

	import type {
		ReglScatterPointDispatch,
		WebGLExtentScalers,
	} from "./regl-scatter";
	import { tick } from "svelte";

	export let viewFunction: View.Component;
	export let viewOptions: View.Options = {};
	export let autoResize = true;

	let height = 850; // canvas dims
	let width = 1000; // canvas dims
	let pointSizeSlider = 3;
	let embedExists = false;
	let points: Points2D;
	let computingPoints = false; // spinner when true
	let pointOpacities: number[] = [];
	// column to color scatterplot by
	let colorByColumn: ZenoColumn = $status.completeColumns[0];
	let dehighlightPoints = () => {
		// nada
	};
	let highlightPoints = (x: number[]) => {
		// nada
	};

	let pointToWebGL: WebGLExtentScalers; // functions to scale points
	let pointHover: ReglScatterPointDispatch;
	let hoverViewDivEl: HTMLDivElement; // show view on point hover
	let containerEl: HTMLDivElement; // save so I can resize

	$: project2DOnModelAndTransformChange($model, colorByColumn);
	$: {
		if (containerEl && autoResize) {
			resizeScatter();
		}
	}
	$: if ($selectionIds.ids.length === 0) {
		dehighlightPoints();
	}

	$: if (points) {
		getPointOpacities($selectionPredicates).then((filteredOpacities) => {
			pointOpacities = filteredOpacities;
		});
	}

	// Runs when scatter has mounted and only once
	// visually reselects the points from when this component
	// was destroyed
	let runOnce = false;
	let mounted = false;
	let reloadedIndices: number[] = [];
	$: if (points && !runOnce && mounted) {
		rehighlightSelectedPoints();
		runOnce = true;
	}

	async function rehighlightSelectedPoints() {
		reloadedIndices = getIndicesFromIds(points.ids, $selectionIds.ids);
		await tick();
		highlightPoints(reloadedIndices);
	}

	function getIndicesFromIds(allIds: string[], filterIds: string[]) {
		const index = new Map();
		allIds.forEach((id, i) => {
			index.set(id, i);
		});
		const indices = filterIds.map((id) => index.get(id));
		return indices;
	}

	/**
	 * assigns ones outside of the filter predicates as partial opacity
	 * and ones inside full opacity
	 */
	async function getPointOpacities(
		selectionPredicates: FilterPredicateGroup[],
		{ fullOpacity = 1, partialOpacity = 0.25 } = {}
	) {
		const filteredIds = (await getFilteredIdsFromPredicates(
			selectionPredicates
		)) as string[];
		const filteredIdsIndex = new Map(
			filteredIds.map((id, index) => [id, index])
		);
		if (filteredIds.length > 0) {
			return points.ids.map((id) =>
				filteredIdsIndex.has(id) ? fullOpacity : partialOpacity
			);
		} else {
			return new Array(points.ids.length).fill(fullOpacity);
		}
	}

	/**
	 * Gets the ids from the filter predicates and
	 */
	async function getFilteredIdsFromPredicates(
		selectionPredicates: FilterPredicateGroup[]
	) {
		const ids = await getFilteredIds(selectionPredicates);
		return ids;
	}

	/**
	 * Main driver behind fetching the projected points and displaying
	 * them in the scale that WebGL expects between [-1, 1]
	 */
	async function project2DOnModelAndTransformChange(
		model: string,
		colorColumn: ZenoColumn
	) {
		embedExists = await checkEmbedExists(model);

		if (embedExists) {
			// show spinner
			computingPoints = true;

			// requests tsne from backend
			points = (await projectEmbedInto2D(model, colorColumn)) as Points2D;

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
		const entry = await getEntry(id);

		// create the data view component and replace the div with the new component
		createViewComponent(viewFunction, entry, viewOptions, hoverViewDivEl);
	}

	function clearPointHover() {
		pointHover = undefined;
	}

	function resizeScatter() {
		if (containerEl && autoResize) {
			width = containerEl.clientWidth;
		}
	}

	/**
	 * Selects the points and gets the ids for the selected entries
	 *
	 * @todo make this native to the filter predicates somehow
	 * right now I just consider it separate
	 */
	function selectPoints(e: CustomEvent<number[]>) {
		const selectedIndices = e.detail;
		const selectedIds = selectedIndices.map((index) => points.ids[index]);
		selectionIds.set({ ids: selectedIds });
	}
	function deselectPoints() {
		selectionIds.set({ ids: [] });
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
							on:select={selectPoints}
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
								style:width="{100}px"
								style:height="{80}px"
								style:left="{pointHover.canvasX + 5}px"
								style:top="{pointHover.canvasY + 5}px">
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
		<ScatterSettings bind:colorByColumn bind:pointSizeSlider />
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
		z-index: 999;
		padding: 30px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 30%, 0.1);
		border-radius: 3px;
	}
	#settings {
		position: absolute;
		bottom: 10px;
		right: 10px;
		width: 300px;
		z-index: 999;
		padding-left: 20px;
		padding-top: 20px;
		box-shadow: 0px 0px 1px 1px hsla(0, 0%, 30%, 0.1);
		border-radius: 3px;
	}
</style>
