<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";
	import Explore from "./Explore.svelte";
	import Predict from "./Predict.svelte";
	import Report from "./Report.svelte";
	import Header from "./general/Header.svelte";
	import ReportPage from "./report/report-page/ReportPage.svelte";
	import { selections, status } from "./stores";
	import { columnHash, getInitialData } from "./util/util";
	import { OpenAPI } from "./zenoservice";

	const routes = {
		"/": Explore,
		"/predict/": Predict,
		"/explore/": Explore,
		"/report/": Report,
		"/report/:id": ReportPage,
		"/report/:id/new": ReportPage,
		"*": Explore,
	};

	OpenAPI.BASE =
		location.protocol + "//" + location.host + location.pathname + "api";

	status.subscribe((stat) => {
		let tempSelections = {};
		stat.completeColumns
			.filter((col) => !$selections.metadata[columnHash(col)])
			.forEach((col) => {
				tempSelections[columnHash(col)] = { predicates: [], join: "" };
			});
		selections.update((sels) => ({
			slices: sels.slices,
			metadata: tempSelections,
		}));
	});

	onMount(() => getInitialData());
</script>

<main>
	<Header />
	<div id="main">
		<Router {routes} />
	</div>
</main>

<style>
	* :global(.demo-list) {
		max-width: 50px;
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

	#main {
		width: calc(100vw - 50px);
	}
</style>
