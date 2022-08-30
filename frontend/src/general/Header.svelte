<script lang="ts">
	import CircularProgress from "@smui/circular-progress";
	import { Svg } from "@smui/common/elements";
	import IconButton, { Icon } from "@smui/icon-button";
	import Tooltip, { Wrapper } from "@smui/tooltip";
	import {
		mdiCheckboxMarkedCircleOutline,
		mdiCircleOutline,
		mdiDotsCircle,
		mdiApi,
		mdiGithub,
	} from "@mdi/js";

	import { updateTab } from "../util/util";
	import { location } from "svelte-spa-router";
	import { status, tab } from "../stores";

	let runningAnalysis = true;

	status.subscribe((s) => {
		if (s.status.startsWith("Done")) {
			runningAnalysis = false;
		} else {
			runningAnalysis = true;
		}
	});

	location.subscribe((d) => {
		let p = d.split("/")[1];
		if (!p) {
			tab.set("exploration");
		} else {
			tab.set(p);
		}
	});
</script>

<header>
	<div class="inline">
		<img
			style="width:100px; margin-right: 50px;"
			src="build/zeno.png"
			alt="Square spiral logo next to 'Zeno'" />
		<div id="tabs">
			<div
				class="item {$tab === 'discovery' ? 'selected' : ''}"
				on:click={() => updateTab("discovery")}>
				<div class="icon">
					<Icon component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "discovery" ? "#6a1b9a" : "black"}
							d={mdiDotsCircle} />
					</Icon>
				</div>
				<div class="tab-text">Discovery</div>
			</div>
			<div
				class="item {$tab === 'exploration' ? 'selected' : ''}"
				on:click={() => updateTab("exploration")}>
				<div class="icon">
					<Icon component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "exploration" ? "#6a1b9a" : "black"}
							d={mdiCircleOutline} />
					</Icon>
				</div>
				<div class="tab-text">Exploration</div>
			</div>
			<div
				class="item {$tab === 'analysis' ? 'selected' : ''}"
				on:click={() => updateTab("analysis")}>
				<div class="icon">
					<Icon component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "analysis" ? "#6a1b9a" : "black"}
							d={mdiCheckboxMarkedCircleOutline} />
					</Icon>
				</div>
				<div class="tab-text">Analysis</div>
			</div>
		</div>
		<div class="status inline">
			{#if runningAnalysis}
				<CircularProgress
					class="status-circle"
					style="height: 32px; width: 32px; margin-right:20px"
					indeterminate />
				<span>{@html $status.status}</span>
			{/if}
		</div>
	</div>

	<div class="icons">
		<Wrapper>
			<IconButton href="http://zenoml.com/docs/intro/">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiApi} />
				</Icon>
			</IconButton>
			<Tooltip>read the documentation</Tooltip>
		</Wrapper>
		<Wrapper>
			<IconButton href="https://github.com/cmudig/zeno">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiGithub} />
				</Icon>
			</IconButton>
			<Tooltip>see the code on GitHub</Tooltip>
		</Wrapper>
	</div>
</header>

<style>
	header {
		display: flex;
		color: black;
		flex-direction: row;
		justify-content: space-between;
		padding-top: 5px;
		padding-bottom: 5px;
		padding-right: 20px;
		padding-left: 20px;
		background: #f8f8f8;
		border-bottom: 1px solied #e0e0e0;
	}

	img {
		align-self: center;
	}

	.inline {
		display: flex;
		flex-direction: inline;
		align-items: center;
		justify-content: center;
	}

	.icon {
		width: 24px;
		height: 24px;
		margin: 0px auto;
	}
	.item {
		margin: 0px auto;
		height: 50px;
		display: flex;
		align-items: center;
		cursor: pointer;
		margin-right: 20px;
		padding-left: 10px;
		padding-right: 10px;
	}

	.item:hover {
		background-color: #f5f5f5;
	}

	.selected {
		color: #6a1b9a;
		font-weight: 500;
	}

	#tabs {
		display: flex;
		flex-direction: inline;
	}
	.tab-text {
		margin-left: 10px;
	}
</style>
