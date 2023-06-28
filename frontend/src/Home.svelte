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
	import { mdiChevronLeft } from "@mdi/js";
	import { progressSteps, taskDescription } from "./util/demoMetadata";
	import Checkbox from "@smui/checkbox";
	import {
		datasets,
		featureFunctions,
		initialPrompt,
		metrics,
		models,
		promptToString,
		tasks,
	} from "./util/demoMetadata";
	import Huggingface from "./general/Huggingface.svelte";
	import FormField from "@smui/form-field";

	let dialogStep = 0;
	let description = "";
	let prompt = "";
	let task = null;
	let selectedDataset = null;
	let loading = false;
	let progress = 0;
	let timer: NodeJS.Timer;
	$: if (progress === 1) {
		tab.set("explore");
		window.location.hash = "/explore";
	}

	function explore() {
		dialogStep = 6;
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

	function loadResults() {
		loading = true;
		setTimeout(() => {
			dialogStep = 1;
			loading = false;
		}, 2000);
	}

	function createProject() {
		dialogStep = 4;
	}

	async function download() {
		let res = await fetch("build/zeno_scripts.zip");
		let blob = await res.blob();
		let url = window.URL || window.webkitURL;
		let link = url.createObjectURL(blob);
		let a = document.createElement("a");
		a.setAttribute("download", "zeno_scripts.zip");
		a.setAttribute("href", link);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<div id="container">
	<div class="start" use:autoAnimate>
		{#if dialogStep > 0 && dialogStep < 6}
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
								style="width: 100%; height: 120px"
								label="Task Description"
								bind:value={description}
								on:focus={() =>
									setTimeout(() => {
										description = taskDescription;
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
							<Label>Next</Label>
						</Button>
					{/if}
				{/if}
			</div>
		{:else if dialogStep === 1}
			<div class="results full-width">
				<h3 class="step-header">Dataset</h3>
				<p class="full-width">These datasets could be useful for you.</p>
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
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				disabled={selectedDataset === null}
				on:click={() => {
					dialogStep = 2;
				}}
				variant="raised"
				color="primary"
				style="width: 300px; margin-bottom:10px;">
				<Label>Select Dataset</Label>
			</Button>
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				disabled
				variant="raised"
				color="primary"
				style="width: 300px;">
				<Label>Create New Dataset</Label>
			</Button>
		{:else if dialogStep === 2}
			<div class="results full-width">
				<h3 class="step-header">Feature Functions</h3>
				<p class="full-width">These functions could be used with your data.</p>
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
					<Label>Select Feature Functions</Label>
				</Button>
			</div>
		{:else if dialogStep === 3}
			<div class="results full-width">
				<h3 class="step-header">Metrics</h3>
				<p class="full-width">These metrics could be used for evaluation.</p>
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
					<Label>Select Metrics</Label>
				</Button>
			</div>
		{:else if dialogStep === 4}
			<div class="results centered-column-flex">
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => (dialogStep = 5)}
					variant="raised"
					color="primary"
					style="width: 300px; margin-bottom: 10px;">
					<Label>Build in Zeno</Label>
				</Button>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={download}
					variant="raised"
					color="primary"
					style="width: 300px;">
					<Label>Build Offline</Label>
				</Button>
			</div>
		{:else if dialogStep === 5}
			<div class="results full-width">
				<div class:fields={prompt !== ""}>
					<p class="full-width">What models would you like to run?</p>
					{#each models as model}
						<div
							class="starting-row-flex"
							use:tooltip={{
								content: model.explanation,
								position: "left",
								theme: "zeno-tooltip",
								maxWidth: "200",
							}}>
							<FormField>
								<Checkbox bind:checked={model.checked} />
								<span slot="label">{model.name}</span>
							</FormField>
						</div>
					{/each}
					<p class="full-width">Which prompt would you like to use?</p>
					<div class="margins">
						<Textfield
							textarea
							style="width: 100%; height: 120px"
							label="Prompt"
							bind:value={prompt}
							on:focus={() =>
								setTimeout(() => {
									$currentPrompt = initialPrompt;
									prompt = promptToString(initialPrompt).replaceAll("\n", "");
								}, 700)} />
					</div>
				</div>
				{#if prompt !== ""}
					<Button
						on:mouseleave={blur}
						on:focusout={blur}
						on:click={explore}
						variant="raised"
						color="primary"
						style="width: 300px;">
						<Label>Build</Label>
					</Button>
				{/if}
			</div>
		{:else}
			<div class="results centered-column-flex">
				<CircularProgress
					style="height: 32px; width: 32px; margin-bottom: 10px;"
					{progress} />
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
	.step-header {
		margin: 0;
	}
</style>
