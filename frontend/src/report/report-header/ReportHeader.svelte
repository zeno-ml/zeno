<script lang="ts">
	import { reports } from "../../stores";
	import { updateTab } from "../../util/util";
	import { clickOutside } from "../../util/clickOutside";
	export let reportId: number;

	let editing = false;
	$: report = $reports[reportId];
</script>

<div class="inline">
	<h4
		class="report-link"
		on:keydown={() => ({})}
		on:click={() => {
			updateTab("report");
		}}>
		Reports
	</h4>
	<b>></b>
	<h4
		class="report-name"
		contenteditable="true"
		on:keydown={() => ({})}
		on:click={() => {
			editing = true;
		}}
		use:clickOutside
		on:click_outside={(e) => {
			if (e.target instanceof HTMLElement && editing) {
				$reports[reportId].name = e.target.innerText;
				editing = false;
			}
		}}>
		{report.name}
	</h4>
</div>

<style>
	.inline {
		margin-left: 20px;
		display: flex;
		flex-direction: inline;
		align-items: center;
		max-width: calc(100vw - 450px);
	}
	.report-link {
		padding: 10px 18px 10px 0px;
		width: fit-content;
		cursor: pointer;
	}
	.report-link:hover {
		color: black;
	}
	.report-name {
		margin-left: 5px;
		margin-right: 5px;
		padding: 10px;
		width: fit-content;
	}
	b {
		color: var(--G2);
		font-weight: 800;
	}
</style>
