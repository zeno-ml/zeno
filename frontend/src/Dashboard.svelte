<script lang="ts">
	import Element from "./dashboard/Element.svelte";
	import { demoReport, ready } from "./stores";
	import Button, { Label } from "@smui/button";
	import {
		ReportTextElementType,
		type ReportElement,
	} from "./util/demoMetadata";

	$: report = $demoReport;
	let isEdit = false;

	function deleteElement(elementIndex: number) {
		$demoReport = {
			...report,
			elements: [
				...report.elements.slice(0, elementIndex),
				...report.elements.slice(elementIndex + 1),
			],
		};
	}

	function addElement(elementIndex: number) {
		$demoReport = {
			...report,
			elements: [
				...report.elements.slice(0, elementIndex + 1),
				{
					type: ReportTextElementType.TEXT,
					text: "new element",
				},
				...report.elements.slice(elementIndex + 1),
			],
		};
	}

	function updateElement(
		event: CustomEvent<{ element: ReportElement }>,
		elementIndex: number
	) {
		$demoReport = {
			...report,
			elements: [
				...report.elements.slice(0, elementIndex),
				event.detail.element,
				...report.elements.slice(elementIndex + 1),
			],
		};
	}
</script>

<main>
	<Button
		style="width: 24px; height: 24px;background-color:var(--G5);position:absolute;right:50px;top:10px"
		on:mouseleave={blur}
		on:focusout={blur}
		on:click={() => (isEdit = !isEdit)}>
		<Label>{isEdit ? "View" : "Edit"}</Label>
	</Button>
	<div class="elements">
		{#if $ready}
			{#each report.elements as element, elementIndex}
				<Element
					{element}
					{isEdit}
					on:addElement={() => addElement(elementIndex)}
					on:deleteElement={() => deleteElement(elementIndex)}
					on:updateElement={(e) => updateElement(e, elementIndex)} />
			{/each}
		{/if}
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		margin-left: 50px;
		height: 100vh;
	}

	.elements {
		overflow-y: auto;
		padding-bottom: 20px;
		padding-top: 20px;
	}
</style>
