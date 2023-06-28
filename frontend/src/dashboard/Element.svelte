<script lang="ts">
	import {
		isChartElement,
		isTextElement,
		type ReportElement,
	} from "../util/demoMetadata";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import TextElement from "./TextElement.svelte";
	import ChartElement from "./ChartElement.svelte";
	import { createEventDispatcher } from "svelte";
	import { mdiCheck, mdiClose, mdiFileEdit, mdiPlus } from "@mdi/js";
	import ElementEdit from "./ElementEdit.svelte";

	const dispatch = createEventDispatcher();
	const dispatchUpdate = createEventDispatcher<{
		updateElement: { element: ReportElement };
	}>();

	export let element: ReportElement;
	export let isEdit: boolean;

	let elementToEdit = false;

	function deleteElement() {
		dispatch("deleteElement");
	}

	function updateElement() {
		elementToEdit = false;
		dispatchUpdate("updateElement", { element: element });
	}

	function addElement() {
		dispatch("addElement");
	}
</script>

<div class="element-container">
	<div class="element-item">
		{#if !elementToEdit}
			{#if isTextElement(element)}
				<TextElement {element} />
			{:else if isChartElement(element)}
				<ChartElement {element} />
			{/if}
		{:else}
			<ElementEdit bind:element />
		{/if}
	</div>
	{#if isEdit && !elementToEdit}
		<div>
			<IconButton on:click={() => (elementToEdit = true)}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiFileEdit} />
				</Icon>
			</IconButton>
			<IconButton on:click={addElement}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiPlus} />
				</Icon>
			</IconButton>
			<IconButton on:click={deleteElement}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiClose} />
				</Icon>
			</IconButton>
		</div>
	{:else if isEdit && elementToEdit}
		<div>
			<IconButton on:click={updateElement}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiCheck} />
				</Icon>
			</IconButton>
		</div>
	{/if}
</div>

<style>
	.element-container {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
	}

	.element-item {
		width: 800px;
	}
</style>
