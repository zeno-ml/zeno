<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";
	import Explore from "./Explore.svelte";
	import Header from "./general/Header.svelte";
	import Report from "./Report.svelte";
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
	} from "./stores";
	import { columnHash } from "./util/util";
	import { ZenoService } from "./zenoservice";

	const routes = {
		"/": Explore,
		"/explore/": Explore,
		"/report/": Report,
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
	/* color styles */
	:global(:root){
		--G1: #333333;
		--G2: #73726F;
		--G3: #989895;
		--G4: #D3D3D3;
		--G5: #EBEBEA;
		--G6: #FFFFFF;
		--logo: #6A1B9A;
		--P1: #B18BD3;
		--P2: #D2BAE9;
		--P3: #E6DEED;
		--P4: #F9F7FB;
		--Y1: #F2F2EE;
		--Y2: #fbfbfa;

		--mdc-theme-primary: var(--G2);
		--mdc-theme-secondary: var(--G3);
		--mdc-theme-background: var(--G6);
		--mdc-theme-surface: var(--G6);
		--mdc-theme-error: #b71c1c;
		--mdc-theme-on-primary: var(--G6);
		--mdc-theme-on-secondary: var(--G6);
		--mdc-theme-on-surface: var(--G1);
		--mdc-theme-on-error: var(--G6);
		--mdc-theme-text-primary-on-background: rgba(0, 0, 0, 0.87);
		--mdc-theme-text-secondary-on-background: rgba(0, 0, 0, 0.54);
		--mdc-theme-text-hint-on-background: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-disabled-on-background: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-icon-on-background: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-primary-on-light: rgba(0, 0, 0, 0.87);
		--mdc-theme-text-secondary-on-light: rgba(0, 0, 0, 0.54);
		--mdc-theme-text-hint-on-light: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-disabled-on-light: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-icon-on-light: rgba(0, 0, 0, 0.38);
		--mdc-theme-text-primary-on-dark: white;
		--mdc-theme-text-secondary-on-dark: rgba(255, 255, 255, 0.7);
		--mdc-theme-text-hint-on-dark: rgba(255, 255, 255, 0.5);
		--mdc-theme-text-disabled-on-dark: rgba(255, 255, 255, 0.5);
		--mdc-theme-text-icon-on-dark: rgba(255, 255, 255, 0.5);
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
