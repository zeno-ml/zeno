<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";

	import { status } from "./stores";
	import { initialFetch, updateTableColumns } from "./util/util";

	import Report from "./report/Report.svelte";
	import Discover from "./discover/Discover.svelte";
	import Explore from "./Explore.svelte";
	import Header from "./general/Header.svelte";

	const routes = {
		"/": Explore,
		"/discover/": Discover,
		"/explore/": Explore,
		"/report/": Report,
		"*": Explore,
	};

	onMount(() => initialFetch());
	status.subscribe((w) => updateTableColumns(w));
</script>

<Header />
<main>
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
		width: 100%;
	}
</style>
