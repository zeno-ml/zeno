<script>
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Button, { Label } from "@smui/button";
	import autoAnimate from "@formkit/auto-animate";
	import Svelecte from "svelecte";
	import { tab } from "./stores";
	import Textfield from "@smui/textfield";
	import FormField from "@smui/form-field";
	import Radio from "@smui/radio";
	import CircularProgress from "@smui/circular-progress";
	import { mdiChevronLeft } from "@mdi/js";
	import Checkbox from "@smui/checkbox";
	import { prompt } from "./util/demoMetadata";

	let dialogStep = 0;
	let description = "";
	let task = null;
	let tasks = [
		{ id: 0, name: "classification" },
		{ id: 1, name: "segmentation" },
		{ id: 2, name: "chatbot" },
		{ id: 3, name: "text-generation" },
	];
	let datasets = [
		{ name: "DSTC11", href: "https://huggingface.co/datasets/gneubig/dstc11" },
		{
			name: "Empathetic Dialogues",
			href: "https://huggingface.co/datasets/empathetic_dialogues",
		},
		{
			name: "Multi WOZ V22",
			href: "https://huggingface.co/datasets/multi_woz_v22",
		},
		{
			name: "Proposal Dialog",
			href: "https://huggingface.co/allenai/proposal-dialog",
		},
		{
			name: "Customer Service",
			href: "https://huggingface.co/LL1234/CustomerService",
		},
	];
	let selectedDataset = null;
	let loading = false;
	let featureFunctions = [
		{ name: "Output Length", checked: true },
		{ name: "Input Length", checked: true },
		{ name: "Chat Context Length", checked: true },
		{ name: "English Number Count", checked: true },
		{ name: "Label Clusters", checked: true },
	];
	let metrics = [
		{ name: "chrf", checked: true },
		{ name: "Length Ratio", checked: true },
		{ name: "BERT Score", checked: true },
		{ name: "Exact Match", checked: true },
		{ name: "Averages of Metrics", checked: true },
	];

	function loadResults() {
		loading = true;
		setTimeout(() => {
			dialogStep = 1;
			loading = false;
		}, 2000);
	}
</script>

<div id="container">
	<div class="start" use:autoAnimate>
		{#if dialogStep > 0}
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
				<div class:fields={task !== ""}>
					<p class="full-width">What kind of task are you tackling?</p>
					<Svelecte searchable={false} bind:value={task} options={tasks} />
				</div>
				{#if task !== null && tasks[task].name === "chatbot"}
					<div class:fields={description !== ""}>
						<p class="full-width">Can you describe the problem further?</p>
						<div class="margins">
							<Textfield
								textarea
								style="width: 100%;"
								label="Prompt"
								bind:value={description}
								on:focus={() => (description = prompt)} />
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
				<p class="full-width">Which dataset would you like to use?</p>
				{#each datasets as dataset}
					<FormField>
						<Radio value={dataset.name} bind:group={selectedDataset} />
						<span slot="label">
							<a href={dataset.href} target="_blank">{dataset.name}</a>
						</span>
					</FormField>
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
				<div class="fields">
					{#each featureFunctions as featureFunction}
						<div class="starting-row-flex">
							<Checkbox bind:checked={featureFunction.checked} />
							{featureFunction.name}
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
		{:else}
			<div class="results full-width">
				<div class="fields">
					{#each metrics as metric}
						<div class="starting-row-flex">
							<Checkbox bind:checked={metric.checked} />
							{metric.name}
						</div>
					{/each}
				</div>
				<Button
					on:mouseleave={blur}
					on:focusout={blur}
					on:click={() => {
						tab.set("explore");
						window.location.hash = "/explore";
					}}
					variant="raised"
					color="primary"
					style="width: 300px;">
					<Label>Create Project</Label>
				</Button>
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
</style>
