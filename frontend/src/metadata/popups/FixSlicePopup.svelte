<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import Paper, { Content } from "@smui/paper";
	import { clickOutside } from "../../util/clickOutside";
	import { model, showFixSlice } from "../../stores";
	import { newModel, prompt } from "../../util/demoMetadata";
	import Textfield from "@smui/textfield";
	import Button, { Label } from "@smui/button";

	let paperHeight;
	let currentPrompt = prompt;
	let dialogStep = 0;
	let modelName = $model;
</script>

<div
	id="paper-container"
	bind:clientHeight={paperHeight}
	use:clickOutside
	on:click_outside={() => showFixSlice.set(false)}>
	<Paper
		elevation={7}
		class="paper"
		style="max-height: 75vh; {paperHeight &&
		paperHeight > window.innerHeight * 0.75
			? 'overflow-y: scroll'
			: 'overflow-y: show'}">
		<Content>
			<div class="container" use:autoAnimate>
				{#if dialogStep === 0}
					<p class="full-width">How would you like to fix this slice?</p>
					<Button
						on:mouseleave={blur}
						on:focusout={blur}
						on:click={() => {
							dialogStep = 1;
						}}
						variant="raised"
						color="primary"
						style="width: 100%; margin-bottom: 10px;">
						<Label>Add in-context examples</Label>
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
				{:else}
					<Textfield
						bind:value={currentPrompt}
						textarea
						label="Current Prompt"
						style="width: 100%; height: 200px; margin-bottom: 10px;" />
					<Textfield
						bind:value={modelName}
						label="Model Name"
						style="width: 100%; margin-bottom: 10px;" />
					<Button
						on:mouseleave={blur}
						on:focusout={blur}
						disabled={modelName === $model}
						on:click={() => {
							$showFixSlice = false;
							$model = newModel;
						}}
						variant="raised"
						color="primary"
						style="width: 100%;">
						<Label>Add new model</Label>
					</Button>
				{/if}
			</div>
		</Content>
	</Paper>
</div>

<style>
	#paper-container {
		position: fixed;
		left: 50%;
		margin-left: -250px;
		top: 70px;
		z-index: 20;
		width: 500px;
	}
	#submit {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
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
</style>
