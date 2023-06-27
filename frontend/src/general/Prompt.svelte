<script lang="ts">
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Button from "@smui/button";
	import Textfield from "@smui/textfield";
	import type { Prompt } from "../util/demoMetadata";
	import { agents, textSnippets } from "../util/demoMetadata";
	import Svelecte from "svelecte";
	import { mdiClose } from "@mdi/js";

	export let prompt: Prompt;
</script>

<div class="prompt-parent">
	<Textfield
		bind:value={prompt.prompt}
		textarea
		label="Overall Prompt"
		style="width: 100%; margin-bottom: 10px" />
	{#each prompt.examples as example, exampleIndex}
		<div class="indent spacing-bot">
			<div class="close-button">
				<IconButton
					on:click={() =>
						(prompt = {
							...prompt,
							examples: [
								...prompt.examples.slice(0, exampleIndex),
								...prompt.examples.slice(exampleIndex + 1),
							],
						})}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiClose} />
					</Icon>
				</IconButton>
			</div>
			<Textfield
				label="Exampple Prompt"
				bind:value={example.prompt}
				on:focus={() => {
					switch (exampleIndex) {
						case 0:
							setTimeout(() => {
								example.prompt = textSnippets[0];
							}, 500);
							break;
						case 1:
							setTimeout(() => {
								example.prompt = textSnippets[2];
							}, 500);
							break;
						default:
							break;
					}
				}}
				textarea
				style="width: 100%;" />
			{#each example.conversationElements as element, elementIndex}
				<div class="horizontal spacing-top">
					<div class="close-button">
						<IconButton
							on:click={() =>
								(prompt = {
									...prompt,
									examples: [
										...prompt.examples.slice(0, exampleIndex),
										{
											...prompt.examples[exampleIndex],
											conversationElements: [
												...prompt.examples[
													exampleIndex
												].conversationElements.slice(0, elementIndex),
												...prompt.examples[
													exampleIndex
												].conversationElements.slice(elementIndex + 1),
											],
										},
										...prompt.examples.slice(exampleIndex + 1),
									],
								})}>
							<Icon component={Svg} viewBox="0 0 24 24">
								<path fill="black" d={mdiClose} />
							</Icon>
						</IconButton>
					</div>
					<Svelecte
						searchable={false}
						bind:value={element.agent}
						options={agents}
						style="margin-right: 10px; max-width: 120px;" />
					<Textfield
						label="Text"
						bind:value={element.text}
						textarea
						on:focus={() => {
							if (exampleIndex === 0 && elementIndex === 0) {
								setTimeout(() => {
									element.text = textSnippets[1];
								}, 500);
							} else if (exampleIndex === 1) {
								switch (elementIndex) {
									case 0:
										setTimeout(() => {
											element.text = textSnippets[3];
										}, 500);
										break;
									case 1:
										setTimeout(() => {
											element.text = textSnippets[4];
										}, 500);
										break;
									case 2:
										setTimeout(() => {
											element.text = textSnippets[5];
										}, 500);
										break;
									case 3:
										setTimeout(() => {
											element.text = textSnippets[6];
										}, 500);
										break;
									default:
										break;
								}
							}
						}}
						style="flex-grow: 1; height: 50px;" />
				</div>
			{/each}
			<Button
				color="secondary"
				on:click={() => {
					let elements = [
						...example.conversationElements,
						{
							agent: 0,
							text: "",
						},
					];
					prompt = {
						...prompt,
						examples: [
							...prompt.examples.slice(0, exampleIndex),
							{ prompt: example.prompt, conversationElements: [...elements] },
							...prompt.examples.slice(exampleIndex + 1),
						],
					};
				}}>
				add element
			</Button>
		</div>
	{/each}
	<Button
		color="secondary"
		on:click={() => {
			let examples = [
				...prompt.examples,
				{
					prompt: "",
					conversationElements: [],
				},
			];
			prompt = { ...prompt, examples: examples };
		}}>
		add example
	</Button>
</div>

<style>
	.prompt-parent {
		width: 100%;
		margin-bottom: 30px;
	}

	.spacing-bot {
		margin-bottom: 20px;
	}

	.spacing-top {
		margin-top: 10px;
	}

	.indent {
		margin-left: 30px;
	}

	.horizontal {
		display: flex;
	}

	.close-button {
		position: absolute;
		right: 0px;
		z-index: 20;
	}
</style>
