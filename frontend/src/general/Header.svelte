<script lang="ts">
	import {
		mdiApi,
		mdiChartBoxOutline,
		mdiCompassOutline,
		mdiGithub,
		mdiPlusCircleOutline,
	} from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import Tooltip, { Wrapper } from "@smui/tooltip";

	import { location } from "svelte-spa-router";

	import { settings, tab } from "../stores";
	import { updateTab } from "../util/util";

	location.subscribe((d) => {
		let p = d.split("/")[1];
		if (!p) {
			tab.set("explore");
		} else {
			tab.set(p);
		}
	});
</script>

<header>
	<div class="inline">
		<a href="/">
			<img
				style="width:30px"
				src="build/zeno.png"
				alt="Square spiral logo next to 'Zeno'" />
		</a>
		<div id="tabs">
			{#if $settings && $settings.inferenceView}
				<Wrapper>
					<div
						class="item {$tab === 'predict' ? 'selected' : ''}"
						on:keydown={() => ({})}
						on:click={() => updateTab("predict")}>
						<div class="icon">
							<Icon component={Svg} viewBox="0 0 24 24">
								<path
									fill={$tab === "predict" ? "#6a1b9a" : "black"}
									d={mdiPlusCircleOutline} />
							</Icon>
						</div>
					</div>
					<Tooltip xPos="end">Test your model with your own inputs.</Tooltip>
				</Wrapper>
			{/if}
			<Wrapper>
				<div
					class="item {$tab === 'explore' ? 'selected' : ''}"
					on:keydown={() => ({})}
					on:click={() => updateTab("explore")}>
					<div class="icon">
						<Icon component={Svg} viewBox="0 0 24 24">
							<path
								fill={$tab === "explore" ? "#6a1b9a" : "black"}
								d={mdiCompassOutline} />
						</Icon>
					</div>
				</div>
				<Tooltip xPos="end">Explore your data and create slices</Tooltip>
			</Wrapper>
			<Wrapper>
				<div
					class="item {$tab === 'report' ? 'selected' : ''}"
					on:keydown={() => ({})}
					on:click={() => updateTab("report")}>
					<div class="icon">
						<Icon component={Svg} viewBox="0 0 24 24">
							<path
								fill={$tab === "report" ? "#6a1b9a" : "black"}
								d={mdiChartBoxOutline} />
						</Icon>
					</div>
				</div>
				<Tooltip xPos="end">Create reports of your slices</Tooltip>
			</Wrapper>
		</div>
	</div>

	<div class="icons">
		<Wrapper>
			<IconButton href="http://zenoml.com/docs/intro/">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiApi} />
				</Icon>
			</IconButton>
			<Tooltip xPos="end" yPos="above">Read the documentation</Tooltip>
		</Wrapper>
		<Wrapper>
			<IconButton href="https://github.com/zeno-ml/zeno">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiGithub} />
				</Icon>
			</IconButton>
			<Tooltip xPos="end" yPos="above">See the code on GitHub</Tooltip>
		</Wrapper>
	</div>
</header>

<style>
	header {
		height: 100vh;
		width: 50px;
		display: flex;
		color: var(--G1);
		flex-direction: column;
		justify-content: space-between;
		background: var(--Y1);
	}

	img {
		align-self: center;
		margin-top: 30px;
		margin-bottom: 10px;
	}

	.inline {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.icon {
		width: 24px;
		height: 24px;
	}
	.icons {
		margin: 0px auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.item {
		margin: 0px auto;
		display: flex;
		align-items: center;
		cursor: pointer;
		padding-left: 10px;
		padding-right: 10px;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	.item:hover {
		background-color: rgb(0, 0, 0, 0.05);
	}

	.selected {
		color: var(--logo);
		font-weight: 500;
	}

	#tabs {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}
</style>
