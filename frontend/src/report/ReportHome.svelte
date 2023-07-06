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
	import { tooltip } from "@svelte-plugins/tooltips";
	import { reports, slices, models, metrics } from "../stores";
	import { ChartType } from "../zenoservice";
	import { updateTab } from "../util/util";
	import ReportHomeRow from "./ReportHomeRow.svelte";

	let blur = function (ev) {
		ev.target.blur();
	};

	let rowsPerPage = 10;
	let currentPage = 0;
	let sortCol = ["", false];
	let header = ["type", "name", "slices", "models", "metrics", "createdAt"];

	$: start = currentPage * rowsPerPage;
	$: end = Math.min(start + rowsPerPage, $reports.length);
	$: content = $reports.slice(start, end);
	$: lastPage = Math.max(Math.ceil($reports.length / rowsPerPage) - 1, 0);

	$: if (currentPage > lastPage) {
		currentPage = lastPage;
	}

	function updateSort(columnName) {
		if (sortCol[0] !== columnName) {
			sortCol = [columnName, true];
		} else if (sortCol[0] === columnName && sortCol[1]) {
			sortCol = [columnName, false];
		} else {
			sortCol = [undefined, false];
		}
		if (sortCol[0]) {
			sortByCol($reports, sortCol);
		} else {
			sortByCol($reports, ["createdAt", true]);
		}
	}

	function sortByCol(items, sortCol) {
		let sortResult = items.sort((a, b) => {
			let ascending;
			let descending;
			if (["slices", "models", "metrics"].includes(sortCol[0])) {
				ascending = a[sortCol[0]].length > b[sortCol[0]].length ? 1 : -1;
				descending = a[sortCol[0]].length < b[sortCol[0]].length ? 1 : -1;
			} else {
				ascending = a[sortCol[0]] > b[sortCol[0]] ? 1 : -1;
				descending = a[sortCol[0]] < b[sortCol[0]] ? 1 : -1;
			}
			return sortCol[1] ? ascending : descending;
		});
		$reports = sortResult;
	}
</script>

<div id="reports-container">
	<div class="header">
		<h3>Reports</h3>
		<div
			use:tooltip={{
				content: "create a new report",
				position: "right",
				theme: "zeno-tooltip",
			}}>
			<IconButton
				on:click={() => {
					reports.update((reps) => {
						updateTab("report/" + reps.length + "/new");
						reps.push({
							id: reps.length,
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
							createdAt: new Date().toLocaleString(),
						});
						return reps;
					});
				}}
				on:mouseleave={blur}
				on:focusout={blur}>
				<Icon style="outline:none" component={Svg} viewBox="0 -1 24 24">
					<path fill="black" d={mdiPlus} />
				</Icon>
			</IconButton>
		</div>
	</div>
	<div class="reports">
		<DataTable style="width: 100%">
			<Head>
				<Row>
					{#each header as h}
						<Cell
							style={h === "name"
								? "cursor: pointer;width: 100%;"
								: "cursor: pointer;"}
							on:keydown={() => ({})}
							on:click={() => updateSort(h)}>
							<div style="display: flex; align-items: center">
								{h === "createdAt"
									? "Created At"
									: h[0].toUpperCase() + h.slice(1).toLowerCase()}
								<Icon class="material-icons" style="font-size: 25px;">
									{#if sortCol[0] === h && sortCol[1]}
										arrow_drop_up
									{:else if sortCol[0] === h}
										arrow_drop_down
									{/if}
								</Icon>
							</div>
						</Cell>
					{/each}
					<Cell>Options</Cell>
				</Row>
			</Head>
			<Body>
				{#each content as report}
					<ReportHomeRow {report} />
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
		width: calc(70vw);
		min-width: 800px;
	}
	.header {
		display: flex;
		align-items: center;
	}
</style>
