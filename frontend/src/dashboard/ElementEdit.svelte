<script lang="ts">
	import Textfield from "@smui/textfield";
	import {
		isChartElement,
		ReportTextElementType,
		type ReportElement,
		isTextElement,
	} from "../util/demoMetadata";
	import Svelecte from "svelecte";
	import { reports } from "../stores";

	export let element: ReportElement;

	const reportOptions = $reports.map((report, index) => {
		return { id: index, name: report.name };
	});
</script>

<div>
	<Svelecte
		value={isChartElement(element) ? "Chart" : "Text"}
		on:change={(e) => {
			if (e.detail.label === "Chart") {
				element = {
					reportIndex: 0,
				};
			} else {
				element = {
					type: ReportTextElementType.TEXT,
					text: "",
				};
			}
		}}
		style="padding-bottom: 20px;"
		searchable={false}
		valueField="label"
		options={["Chart", "Text"]} />
	{#if isChartElement(element)}
		<div class="edit-element">
			<Svelecte
				searchable={false}
				bind:value={element.reportIndex}
				options={reportOptions} />
		</div>
	{:else if isTextElement(element)}
		<div class="edit-element">
			<Svelecte
				style="padding-bottom: 10px;"
				value={element.type}
				on:change={(e) => {
					element = {
						type: ReportTextElementType[
							Object.keys(ReportTextElementType)[
								Object.values(ReportTextElementType).indexOf(e.detail.label)
							]
						],
						text: element.text,
					};
				}}
				searchable={false}
				valueField="label"
				options={Object.values(ReportTextElementType)} />
		</div>
		<div class="edit-element">
			<Textfield
				textarea
				label="Text"
				bind:value={element.text}
				style="width: 100%;" />
		</div>
	{/if}
</div>

<style>
	.edit-element {
		margin-left: 20px;
	}
</style>
