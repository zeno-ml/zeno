<script lang="ts">
	import { mdiArrowCollapseLeft } from "@mdi/js";
	import { reports } from "../../../stores";
	import { updateTab } from "../../../util/util";
	import { Svg } from "@smui/common";
	import Textfield from "@smui/textfield";
	import CharacterCounter from "@smui/textfield/character-counter";
	export let reportId: number;

	let ishover = false;
	$: rep = $reports[reportId];
</script>

<div class="header-flex">
	<div
		class="return-link"
		on:keydown={() => ({})}
		on:click={() => {
			updateTab("report");
		}}
		on:focus={() => ({})}
		on:mouseover={() => {
			ishover = true;
		}}
		on:blur={() => ({})}
		on:mouseout={() => {
			ishover = false;
		}}>
		<Svg
			style="width: 24px; height: 24px; padding-right: 10px"
			viewBox="-2 -2 26 26">
			<path fill={ishover ? "black" : "var(--G2)"} d={mdiArrowCollapseLeft} />
		</Svg>
		<h4 style={ishover ? "color:black" : "color:var(--G2)"}>
			Back to Report Home
		</h4>
	</div>
	<div class="report-name">
		<Textfield
			style="width: -webkit-fill-available"
			variant="outlined"
			bind:value={rep.name}
			label="Report Name"
			input$maxlength={15}>
			<CharacterCounter slot="helper">0 / 15</CharacterCounter>
		</Textfield>
	</div>
</div>

<style>
	.header-flex {
		display: flex;
		flex-direction: column;
	}
	.return-link {
		display: flex;
		flex-direction: row;
		align-items: center;
		cursor: pointer;
		width: fit-content;
	}
</style>
