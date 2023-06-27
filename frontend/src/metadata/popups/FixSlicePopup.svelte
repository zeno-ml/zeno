<script lang="ts">
	import { Svg } from "@smui/common";
	import autoAnimate from "@formkit/auto-animate";
	import Paper, { Content } from "@smui/paper";
	import IconButton, { Icon } from "@smui/icon-button";
	import { mdiChevronLeft } from "@mdi/js";
	import { clickOutside } from "../../util/clickOutside";
	import { currentPrompt, showFixSlice } from "../../stores";
	import { promptToString } from "../../util/demoMetadata";
	import Button, { Label } from "@smui/button";
	import Prompt from "../../general/Prompt.svelte";

	let paperHeight;
	let dialogStep = 0;
	let prompt = $currentPrompt;
	let copied = false;
</script>

<div
	class="paper-container"
	class:narrow={dialogStep === 0}
	class:wide={dialogStep === 1}
	bind:clientHeight={paperHeight}
	use:clickOutside
	on:click_outside={() => showFixSlice.set(false)}>
	<Paper
		elevation={7}
		class="paper"
		style="padding-top: 0px; max-height: 75vh; {paperHeight &&
		paperHeight > window.innerHeight * 0.75
			? 'overflow-y: scroll'
			: 'overflow-y: show'}">
		<Content>
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
								$currentPrompt = prompt;
								$showFixSlice = false;
							}}
							variant="raised"
							style="margin-right: 10px"
							color="primary">
							<Label>Save Prompt</Label>
						</Button>
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
							color="primary">
							{#if copied}
								<Label>Copied!</Label>
							{:else}
								<Label>Copy to Clipboard</Label>
							{/if}
						</Button>
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
