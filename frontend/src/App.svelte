<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";

	import { selections, status } from "./stores";
	import { columnHash } from "./util/util";
	import { getInitialData } from "./api";

	import Explore from "./Explore.svelte";
	import Header from "./general/Header.svelte";
	import Report from "./report/Report.svelte";

	const routes = {
		"/": Explore,
		"/explore/": Explore,
		"/report/": Report,
		"*": Explore,
	};

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
