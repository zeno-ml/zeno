<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import { mdiChevronLeft } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { Content } from "@smui/paper";
	import Prompt from "../../general/Prompt.svelte";
	import { currentPrompt, showFixSlice } from "../../stores";
	import { modelSteps, newPrompt1, newPrompt2 } from "../../util/demoMetadata";

	let dialogStep = 0;
	let prompt =
		$currentPrompt.examples.length > 1
			? $currentPrompt
			: $currentPrompt.examples.length === 0
			? newPrompt1($currentPrompt)
			: newPrompt2($currentPrompt);
	let progress = 0;
	let timer: NodeJS.Timer;

	$: currentPrompt.set(prompt);
	$: if (progress === 1) {
		showFixSlice.set(false);
	}

	function addModel() {
		dialogStep = 1;
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
				Update the prompt used to evaluate the model:
			</p>
			<Prompt bind:prompt />
			<div class="horizontal end">
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					disabled
					variant="raised"
					color="primary">
					<Label>Fine-tune on new data</Label>
				</Button>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						addModel();
					}}
					variant="raised"
					color="primary"
					style="margin-left: 10px;">
					<Label>Update prompt</Label>
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
