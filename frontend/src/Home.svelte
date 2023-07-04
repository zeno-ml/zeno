<script lang="ts">
	import autoAnimate from "@formkit/auto-animate";
	import { mdiChevronLeft } from "@mdi/js";
	import Button, { Label } from "@smui/button";
	import Checkbox from "@smui/checkbox";
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common";
	import FormField from "@smui/form-field";
	import IconButton, { Icon } from "@smui/icon-button";
	import Textfield from "@smui/textfield";
	import { tooltip } from "@svelte-plugins/tooltips";
	import Svelecte from "svelecte";
	import Huggingface from "./general/Huggingface.svelte";
	import { tab } from "./stores";
	import {
		datasets,
		featureFunctions,
		metrics,
		progressSteps,
		taskDescription,
		tasks,
	} from "./util/demoMetadata";

	let dialogStep = 0;
	let description = "";
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
		dialogStep = 4;
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
		explore();
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
		{#if dialogStep > 0 && dialogStep < 5}
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
					<p class="full-width">What LLM task are you working on?</p>
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
				<h3 class="step-header">Select or Create Evaluation Data</h3>
				<p class="full-width">
					To get started, either select an existing representative dataset, or create a new one specifically for your task:
				</p>
				{#each datasets as dataset, datasetIndex}
					<div
						class=" cell parent {datasetIndex === selectedDataset
							? 'selected'
							: ''}"
						on:keydown={() => ({})}
						on:click={() => (selectedDataset = datasetIndex)}
						use:tooltip={{
							content: dataset.description,
							position: "left",
							theme: "zeno-tooltip",
							maxWidth: "200",
						}}>
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
				<p class="full-width">
					Select which features of the data you want to use in analysis of examples:
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
					<Label>Select Feature Functions</Label>
				</Button>
			</div>
		{:else if dialogStep === 3}
			<div class="results full-width">
				<h3 class="step-header">Evaluation Metrics</h3>
				<p class="full-width">
					Select which metrics you want to use for evaluation:
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
					<Label>Select Metrics</Label>
				</Button>
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
