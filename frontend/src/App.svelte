<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";
	import Explore from "./Explore.svelte";
	import Header from "./general/Header.svelte";
	import Predict from "./Predict.svelte";
	import Report from "./Report.svelte";
	import ReportPage from "./report/report-page/ReportPage.svelte";

	import {
		folders,
		metric,
		metrics,
		model,
		models,
		ready,
		reports,
		rowsPerPage,
		selections,
		settings,
		slices,
		status,
		tags,
	} from "./stores";
	import { columnHash } from "./util/util";
	import { ZenoService } from "./zenoservice";

	const routes = {
		"/": Explore,
		"/predict/": Predict,
		"/explore/": Explore,
		"/report/": Report,
		"/report/:id": ReportPage,
		"*": Explore,
	};

	async function getInitialData() {
		const sets = await ZenoService.getSettings();
		settings.set(sets);
		rowsPerPage.set(sets.samples);

		const inits = await ZenoService.getInitialInfo();
		models.set(inits.models);
		metrics.set(inits.metrics);
		folders.set(inits.folders);

		model.set(
			inits.models.length > 0 ? inits.models[inits.models.length - 1] : ""
		);
		metric.set(inits.metrics.length > 0 ? inits.metrics[0] : "");

		const slicesRes = await ZenoService.getSlices();
		slices.set(new Map(Object.entries(slicesRes)));

		const tagsRes = await ZenoService.getTags();
		tags.set(new Map(Object.entries(tagsRes)));

		const reportsRes = await ZenoService.getReports();
		reports.set(reportsRes);

		ready.set(true);
	}

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
			tags: sels.tags,
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
