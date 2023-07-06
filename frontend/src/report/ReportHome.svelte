<script lang="ts">
	import { mdiPlus } from "@mdi/js";
	import DataTable, {
		Head,
		Body,
		Row,
		Cell,
		Pagination,
	} from "@smui/data-table";
	import { Label, Svg } from "@smui/common";
	import Select, { Option } from "@smui/select";
	import IconButton, { Icon } from "@smui/icon-button";
	import { reports, slices, models, metrics } from "../stores";
	import { ChartType } from "../zenoservice";
	import { updateTab } from "../util/util";
	import ReportHomeRow from "./ReportHomeRow.svelte";

	let rowsPerPage = 10;
	let currentPage = 0;

	let blur = function (ev) {
		ev.target.blur();
	};

	$: start = currentPage * rowsPerPage;
	$: end = Math.min(start + rowsPerPage, $reports.length);
	$: content = $reports.slice(start, end);
	$: lastPage = Math.max(Math.ceil($reports.length / rowsPerPage) - 1, 0);

	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}
</script>

<div id="reports-container">
	<div class="header">
		<h3>Reports</h3>
		<IconButton
			on:click={() => {
				reports.update((reps) => {
					updateTab("report/" + reps.length + "/new");
					reps.push({
						name: "New Report",
						type: ChartType.BAR,
						slices: [...Array.from($slices.keys()).slice(0, 2)],
						models: [...$models.values()],
						metrics: [...$metrics.values(), "slice size"],
						parameters: {
							xEncoding: "slices",
							yEncoding: "metrics",
							zEncoding: "models",
							fixedDimension: "y",
							secondSlices: [...Array.from($slices.keys()).slice(0, 2)],
						},
					});
					return reps;
				});
			}}
			on:mouseleave={blur}
			on:focusout={blur}>
			<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
				<path fill="black" d={mdiPlus} />
			</Icon>
		</IconButton>
	</div>
	<div class="reports">
		<DataTable style="width: 100%">
			<Head>
				<Row>
					<Cell numeric>ID</Cell>
					<Cell>Type</Cell>
					<Cell style="width: 100%;">Name</Cell>
					<Cell>Content</Cell>
					<Cell>Options</Cell>
				</Row>
			</Head>
			<Body>
				{#each content as report, reportIndex}
					<ReportHomeRow {report} {reportIndex} />
				{/each}
			</Body>

			<Pagination slot="paginate">
				<svelte:fragment slot="rowsPerPage">
					<Label>Rows Per Page</Label>
					<Select variant="outlined" bind:value={rowsPerPage} noLabel>
						<Option value={5}>5</Option>
						<Option value={10}>10</Option>
						<Option value={25}>25</Option>
					</Select>
				</svelte:fragment>
				<svelte:fragment slot="total">
					{start + 1}-{end} of {$reports.length}
				</svelte:fragment>

				<IconButton
					class="material-icons"
					action="first-page"
					title="First page"
					on:click={() => (currentPage = 0)}
					disabled={currentPage === 0}>first_page</IconButton>
				<IconButton
					class="material-icons"
					action="prev-page"
					title="Prev page"
					on:click={() => currentPage--}
					disabled={currentPage === 0}>chevron_left</IconButton>
				<IconButton
					class="material-icons"
					action="next-page"
					title="Next page"
					on:click={() => currentPage++}
					disabled={currentPage === lastPage}>chevron_right</IconButton>
				<IconButton
					class="material-icons"
					action="last-page"
					title="Last page"
					on:click={() => (currentPage = lastPage)}
					disabled={currentPage === lastPage}>last_page</IconButton>
			</Pagination>
		</DataTable>
	</div>
</div>

<style>
	#reports-container {
		padding: 10px;
		margin-left: 10px;
		overflow-y: auto;
		height: calc(100vh - 80px);
	}
	.reports {
		display: flex;
		flex-wrap: wrap;
		width: calc(60vw);
	}
	.header {
		display: flex;
		align-items: center;
	}
</style>
