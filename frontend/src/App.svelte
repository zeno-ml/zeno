<script lang="ts">
	import {
		mdiChartPie,
		mdiCheckboxMarkedCircleOutline,
		mdiCircle,
		mdiCircleOutline,
		mdiDotsCircle,
	} from "@mdi/js";
	import { Svg } from "@smui/common/elements";
	import { Icon } from "@smui/icon-button";
	import { onMount } from "svelte";
	import Router, { location } from "svelte-spa-router";

	import { metric, metrics, model, models, ready, status, tab } from "./stores";
	import { initialFetch, updateTab, updateTableColumns } from "./util";

	import Analysis from "./analysis/Analysis.svelte";
	import Discovery from "./discovery/Discovery.svelte";
	import Exploration from "./Exploration.svelte";
	import Header from "./Header.svelte";

	const routes = {
		"/": Exploration,
		"/discovery/": Discovery,
		"/exploration/": Exploration,
		"/analysis/": Analysis,
		"*": Exploration,
	};

	tab.set($location.split("/")[1]);
	location.subscribe((d) => {
		tab.set(d.split("/")[1]);
		if (!$tab) {
			tab.set("exploration");
		}
	});

	let el;
	onMount(() => initialFetch());
	status.subscribe((w) => updateTableColumns(w));
	ready.subscribe((r) => {
		if (r) {
			model.set($models[0]);
			metric.set($metrics[0]);
		}
	});
</script>

<Header />
<main>
	<div bind:this={el} />
	<div id="side-menu">
		<div
			class="item {$tab === 'discovery' ? 'selected' : ''}"
			on:click={() => updateTab("discovery")}>
			<div class="icon">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path
						fill={$tab === "discovery" ? "#6a1b9a" : "black"}
						d={mdiDotsCircle} />
				</Icon>
			</div>
		</div>
		<div
			class="item {$tab === 'exploration' ? 'selected' : ''}"
			on:click={() => updateTab("exploration")}>
			<div class="icon">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path
						fill={$tab === "exploration" ? "#6a1b9a" : "black"}
						d={mdiCircleOutline} />
				</Icon>
			</div>
		</div>
		<div
			class="item {$tab === 'analysis' ? 'selected' : ''}"
			on:click={() => updateTab("analysis")}>
			<div class="icon">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path
						fill={$tab === "analysis" ? "#6a1b9a" : "black"}
						d={mdiCheckboxMarkedCircleOutline} />
				</Icon>
			</div>
		</div>
	</div>
	<div id="main">
		<Router {routes} />
	</div>
</main>

<style>
	* :global(.demo-list) {
		max-width: 50px;
	}

	* :global(.mdc-deprecated-list-item) {
		padding-left: 0px;
	}

	main {
		display: flex;
		flex-direction: row;
		text-align: left;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
	.icon {
		width: 24px;
		height: 24px;
		margin: 0px auto;
	}
	.item {
		margin: 0px auto;
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		cursor: pointer;
	}

	.item:hover {
		background-color: #f5f5f5;
	}

	.selected {
		background-color: white;
	}

	#side-menu {
		width: 50px;
		border-right: 1px solid #e0e0e0;
		height: calc(100vh - 60px);
		background: #fafafa;
	}

	#main {
		width: calc(100vw - 50px);
	}
</style>
