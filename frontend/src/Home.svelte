<script lang="ts">
	import { tooltip } from "@svelte-plugins/tooltips";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Button, { Label } from "@smui/button";
	import autoAnimate from "@formkit/auto-animate";
	import Svelecte from "svelecte";
	import { tab, currentPrompt } from "./stores";
	import Textfield from "@smui/textfield";
	import CircularProgress from "@smui/circular-progress";
	import LinearProgress from "@smui/linear-progress";
	import { mdiChevronLeft } from "@mdi/js";
	import Checkbox from "@smui/checkbox";
	import {
		datasets,
		featureFunctions,
		initialPrompt,
		metrics,
		progressSteps,
		promptToString,
		tasks,
	} from "./util/demoMetadata";
	import Huggingface from "./general/Huggingface.svelte";
	import FormField from "@smui/form-field";

	let dialogStep = 0;
	let description = "";
	let task = null;
	let selectedDataset = null;
	let loading = false;
	let progress = null;
	let timer: NodeJS.Timer;

	$: if (progress === 1) {
		tab.set("explore");
		window.location.hash = "/explore";
	}

	function loadResults() {
		loading = true;
		setTimeout(() => {
			dialogStep = 1;
			loading = false;
		}, 2000);
	}

	function createProject() {
		dialogStep = 4;
		progress = 0;
		clearInterval(timer);
		timer = setInterval(() => {
			progress += 0.01;
			if (progress >= 1) {
				progress = 1;
				clearInterval(timer);
			}
		}, 100);
	}
</script>

<div id="container">
	<div class="start" use:autoAnimate>
		{#if dialogStep > 0 && dialogStep < 4}
			<div class="back-button">
				<IconButton on:click={() => (dialogStep -= 1)}>
					<Icon component={Svg} viewBox="0 0 24 24">
						<path fill="black" d={mdiChevronLeft} />
					</Icon>
				</IconButton>
			</div>
		{/if}
		<img src="build/zeno-full.png" alt="Zeno logo" width="200px" />
		{#if dialogStep === 0}
			<div id="fields" use:autoAnimate>
				<div class:fields={task !== null}>
					<p class="full-width">What kind of task are you tackling?</p>
					<Svelecte searchable={false} bind:value={task} options={tasks} />
				</div>
				{#if task !== null && tasks[task].name === "chatbot"}
					<div class:fields={description !== ""}>
						<p class="full-width">Can you describe the problem further?</p>
						<div class="margins">
							<Textfield
								textarea
								style="width: 100%; height: 200px"
								label="Prompt"
								bind:value={description}
								on:focus={() =>
									setTimeout(() => {
										$currentPrompt = initialPrompt;
										description = promptToString(initialPrompt);
									}, 700)} />
						</div>
					</div>
				{/if}
				{#if (task !== null && tasks[task].name !== "chatbot") || description !== ""}
					{#if loading}
						<div class="centered-column-flex full-width">
							<CircularProgress
								style="height: 32px; width: 32px;"
								indeterminate />
						</div>
					{:else}
						<Button
							on:mouseleave={blur}
							on:focusout={blur}
							on:click={loadResults}
							variant="raised"
							color="primary"
							style="width: 300px;">
							<Label>Search</Label>
						</Button>
					{/if}
				{/if}
			</div>
		{:else if dialogStep === 1}
			<div class="results full-width">
				<p class="full-width">
					Here are some datasets that could be useful for you. Select the one
					that you would like to use.
				</p>
				{#each datasets as dataset, datasetIndex}
					<div
						class=" cell parent {datasetIndex === selectedDataset
							? 'selected'
							: ''}"
						on:keydown={() => ({})}
						on:click={() => (selectedDataset = datasetIndex)}>
						<span>
							{dataset.name}
						</span>
						<div class="huggingface-button">
							<IconButton on:click={() => window.open(dataset.href)}>
								<Icon component={Svg} viewBox="0 0 95 88">
									<Huggingface />
								</Icon>
							</IconButton>
						</div>
					</div>
				{/each}
			</div>
			{#if selectedDataset !== null}
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						dialogStep = 2;
					}}
					variant="raised"
					color="primary"
					style="width: 300px;">
					<Label>Select Feature Functions</Label>
				</Button>
			{/if}
		{:else if dialogStep === 2}
			<div class="results full-width">
				<p class="full-width">
					The following functions can be used wiht your selected dataset. Select
					the ones that you would like to run.
				</p>
				<div class="fields">
					{#each featureFunctions as featureFunction}
						<div
							class="starting-row-flex"
							use:tooltip={{
								content: featureFunction.explanation,
								position: "left",
								theme: "zeno-tooltip",
								maxWidth: "200",
							}}>
							<FormField>
								<Checkbox bind:checked={featureFunction.checked} />
								<span slot="label">{featureFunction.name}</span>
							</FormField>
						</div>
					{/each}
				</div>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						dialogStep = 3;
					}}
					variant="raised"
					color="primary"
					style="width: 300px;">
					<Label>Select Metrics</Label>
				</Button>
			</div>
		{:else if dialogStep === 3}
			<div class="results full-width">
				<p class="full-width">
					The following metrics work well with your setup. Select ones that you
					would like to calculate.
				</p>
				<div class="fields">
					{#each metrics as metric}
						<div
							class="starting-row-flex"
							use:tooltip={{
								content: metric.explanation,
								position: "left",
								theme: "zeno-tooltip",
								maxWidth: "200",
							}}>
							<FormField>
								<Checkbox bind:checked={metric.checked} />
								<span slot="label">{metric.name}</span>
							</FormField>
						</div>
					{/each}
				</div>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={createProject}
					variant="raised"
					color="primary"
					style="width: 300px;">
					<Label>Create Project</Label>
				</Button>
			</div>
		{:else}
			<div class="results centered-column-flex">
				<LinearProgress {progress} style="margin-bottom: 10px;" />
				<span>
					{progress < 0.1
						? progressSteps[0]
						: progress < 0.7
						? progressSteps[1]
						: progressSteps[2]}
				</span>
			</div>
		{/if}
	</div>
</div>

<style>
	#container {
		width: 100vw;
		height: 100vh;
		background-color: var(--logo);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.start {
		background: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 50px;
		border-radius: 5px;
	}
	.full-width {
		width: 300px;
	}
	img {
		margin-bottom: 20px;
	}
	.results {
		display: flex;
		flex-direction: column;
		padding-top: 20px;
		padding-bottom: 20px;
		justify-content: start;
	}
	.centered-column-flex {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.starting-row-flex {
		display: flex;
		align-items: center;
	}
	.fields {
		margin-bottom: 30px;
	}
	.back-button {
		position: absolute;
		left: 0px;
		top: 0px;
	}
	.cell {
		border: 0.5px solid var(--G4);
		border-radius: 4px;
		margin-top: 5px;
		display: flex;
		align-items: center;
		padding-left: 10px;
		padding-right: 10px;
		min-height: 36px;
		justify-content: space-between;
	}
	.selected {
		background: var(--P3);
	}
</style>
