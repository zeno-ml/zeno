<script lang="ts">
	import {
		mdiChartPie,
		mdiCheckboxMultipleMarkedCircleOutline,
		mdiCircleOutline,
	} from "@mdi/js";
	import { Svg } from "@smui/common/elements";
	import IconButton, { Icon } from "@smui/icon-button";
	import List, { Item, Separator } from "@smui/list";
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
		<List class="demo-list" iconList={true}>
			<Item
				activated={$tab === "discovery"}
				on:SMUI:action={() => updateTab("discovery")}>
				<IconButton>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiCircleOutline} />
					</Icon>
				</IconButton>
			</Item>
			<Separator />
			<Item
				activated={$tab === "exploration"}
				on:SMUI:action={() => updateTab("exploration")}>
				<IconButton>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="currentColor" d={mdiChartPie} />
					</Icon>
				</IconButton>
			</Item>
			<Separator />
			<Item
				activated={$tab === "analysis"}
				on:SMUI:action={() => updateTab("analysis")}>
				<IconButton>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path
							fill="currentColor"
							d={mdiCheckboxMultipleMarkedCircleOutline} />
					</Icon>
				</IconButton>
			</Item>
			<Separator />
		</List>
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

	#side-menu {
		width: 50px;
		border-right: 1px solid #e0e0e0;
		height: calc(100vh - 60px);
	}

	#main {
		width: calc(100vw - 50px);
	}
</style>
