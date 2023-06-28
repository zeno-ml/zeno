<script lang="ts">
	import {
		ReportTextElementType,
		type ReportTextElement,
	} from "../util/demoMetadata";

	export let element: ReportTextElement;
</script>

{#if element.type === ReportTextElementType.HEADING}
	<h1>
		{@html element.text}
	</h1>
{:else if element.type === ReportTextElementType.SUBHEADING}
	<h3>
		{@html element.text}
	</h3>
{:else}
	<p>
		{@html element.text}
	</p>
{/if}
