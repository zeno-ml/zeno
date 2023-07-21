<script lang="ts">
	import {
		mdiApi,
		mdiChartBoxOutline,
		mdiCompassOutline,
		mdiGithub,
		mdiHomeOutline,
		mdiCompare,
	} from "@mdi/js";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { tooltip } from "@svelte-plugins/tooltips";
	import { location } from "svelte-spa-router";
	import { tab } from "../stores";
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
			<div
				class="item {$tab === 'explore' ? 'selected' : ''}"
				on:keydown={() => ({})}
				on:click={() => updateTab("explore")}
				use:tooltip={{
					content: "Explore your data and model outputs.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<div class="icon">
					<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "explore" ? "#6a1b9a" : "black"}
							d={mdiCompassOutline} />
					</Icon>
				</div>
			</div>
			<div
				class="item {$tab === 'comparison' ? 'selected' : ''}"
				on:keydown={() => ({})}
				on:click={() => updateTab("comparison")}
				use:tooltip={{
					content: "Qualitatively compare model outputs.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<div class="icon">
					<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "comparison" ? "#6a1b9a" : "black"}
							d={mdiCompare} />
					</Icon>
				</div>
			</div>
			<div
				class="item {$tab === 'report' ? 'selected' : ''}"
				on:keydown={() => ({})}
				on:click={() => updateTab("report")}
				use:tooltip={{
					content: "Create charts from your slices and metrics.",
					position: "right",
					theme: "zeno-tooltip",
				}}>
				<div class="icon">
					<Icon style="outline:none" component={Svg} viewBox="0 0 24 24">
						<path
							fill={$tab === "report" ? "#6a1b9a" : "black"}
							d={mdiChartBoxOutline} />
					</Icon>
				</div>
			</div>
		</div>
	</div>

	<div class="icons">
		<div
			use:tooltip={{
				content: "Learn more about Zeno.",
				position: "right",
				theme: "zeno-tooltip",
			}}>
			<IconButton href="http://zenoml.com/">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiHomeOutline} />
				</Icon>
			</IconButton>
		</div>
		<div
			use:tooltip={{
				content: "Explore the documentation.",
				position: "right",
				theme: "zeno-tooltip",
			}}>
			<IconButton href="http://zenoml.com/docs/intro/">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiApi} />
				</Icon>
			</IconButton>
		</div>
		<div
			use:tooltip={{
				content: "See the code on GitHub.",
				position: "right",
				theme: "zeno-tooltip",
			}}>
			<IconButton href="https://github.com/zeno-ml/zeno">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="black" d={mdiGithub} />
				</Icon>
			</IconButton>
		</div>
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
		fill: var(--G1);
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
