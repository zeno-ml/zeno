<script lang="ts">
	import { Svg } from "@smui/common";
	import autoAnimate from "@formkit/auto-animate";
	import Paper, { Content } from "@smui/paper";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiChevronLeft } from "@mdi/js";
	import { clickOutside } from "../../util/clickOutside";
	import { currentPrompt, showFixSlice } from "../../stores";
	import {
		modelSteps,
		newModelName,
		promptToString,
	} from "../../util/demoMetadata";
	import Button, { Label } from "@smui/button";
	import Prompt from "../../general/Prompt.svelte";
	import CircularProgress from "@smui/circular-progress";
	import Textfield from "@smui/textfield";

	let paperHeight;
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

<div
	class="paper-container"
	class:narrow={dialogStep !== 1}
	class:wide={dialogStep === 1}
	bind:clientHeight={paperHeight}
	use:clickOutside
	on:click_outside={() => {
		showFixSlice.set(false);
		$currentPrompt = prompt;
	}}>
	<Paper
		elevation={7}
		class="paper"
		style="padding-top: 0px; max-height: 75vh; {paperHeight &&
		paperHeight > window.innerHeight * 0.75
			? 'overflow-y: scroll'
			: 'overflow-y: show'}">
		<Content>
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
	</Paper>
</div>

<style>
	.paper-container {
		position: fixed;
		left: 50%;
		top: 70px;
		z-index: 20;
	}
	.narrow {
		width: 500px;
		margin-left: -250px;
	}
	.wide {
		width: 800px;
		margin-left: -400px;
	}
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
