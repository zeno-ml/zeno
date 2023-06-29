<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import { mdiChevronLeft } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import Prompt from "../../general/Prompt.svelte";
	import { currentPrompt, showFixSlice } from "../../stores";
	import {
		modelSteps,
		newModelName,
		promptToString,
	} from "../../util/demoMetadata";

	let dialogStep = 0;
	let prompt = $currentPrompt;
	let copied = false;
	let progress = 0;
	let modelName = newModelName;
	let timer: NodeJS.Timer;
	$: if (progress === 1) {
		$currentPrompt = prompt;
		showFixSlice.set(false);
	}

	function addModel() {
		dialogStep = 3;
		progress = 0;
		clearInterval(timer);
		timer = setInterval(() => {
			progress += 0.01;
			if (progress >= 1) {
				progress = 1;
				clearInterval(timer);
			}
		}, 50);
	}
</script>

<Content style={dialogStep === 1 ? "width: 800px;" : "width: 500px;"}>
	{#if dialogStep < 3}
		<div class="horizontal">
			{#if dialogStep > 0}
				<div>
					<IconButton on:click={() => (dialogStep -= 1)}>
						<Icon component={Svg} viewBox="0 0 24 24">
							<path fill="black" d={mdiChevronLeft} />
						</Icon>
					</IconButton>
				</div>
			{/if}
			<h3>{dialogStep === 0 ? "Fix Slice" : "Edit Prompt"}</h3>
		</div>
	{/if}
	<div class="container" use:autoAnimate>
		{#if dialogStep === 0}
			<p class="full-width" style="margin-top: 0px;">
				How would you like to fix this slice?
			</p>
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				on:click={() => {
					dialogStep = 1;
				}}
				variant="raised"
				color="primary"
				style="width: 100%; margin-bottom: 10px;">
				<Label>Modify in-context examples</Label>
			</Button>
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				disabled
				variant="raised"
				color="primary"
				style="width: 100%;">
				<Label>Generate data for fine-tuning</Label>
			</Button>
		{:else if dialogStep === 1}
			<Prompt bind:prompt />
			<div class="horizontal end">
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						navigator.clipboard.writeText(promptToString(prompt));
						copied = true;
						setTimeout(() => {
							copied = false;
						}, 500);
					}}
					variant="raised"
					style="margin-right: 10px"
					color="primary">
					{#if copied}
						<Label>Copied!</Label>
					{:else}
						<Label>Copy to Clipboard</Label>
					{/if}
				</Button>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						dialogStep = 2;
					}}
					variant="raised"
					color="primary">
					<Label>Add new Models</Label>
				</Button>
			</div>
		{:else if dialogStep === 2}
			<Textfield
				style="width: 100%; margin-bottom: 30px;"
				label="Model Name"
				bind:value={modelName} />
			<div class="horizontal end">
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={addModel}
					variant="raised"
					color="primary">
					<Label>Add</Label>
				</Button>
			</div>
		{:else}
			<div class="container">
				<CircularProgress
					style="height: 32px; width: 32px; margin-bottom: 10px; margin-top: 30px;"
					{progress} />
				<span>
					{progress < 0.1
						? modelSteps[0]
						: progress < 0.7
						? modelSteps[1]
						: progress < 0.85
						? modelSteps[2]
						: modelSteps[3]}
				</span>
			</div>
		{/if}
	</div>
</Content>

<style>
	.full-width {
		width: 100%;
	}
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.horizontal {
		display: flex;
		align-items: center;
	}
	.end {
		align-self: end;
	}
</style>
