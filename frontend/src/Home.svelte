<script>
	import Button, { Label } from "@smui/button";
	import { tab } from "./stores";

	let showResults = false;
	let description = "";
</script>

<div id="container">
	<div id="start">
		<img src="build/zeno-full.png" alt="Zeno logo" width="200px" />
		<div id="fields">
			<p>Prompt:</p>
			<div class="margins">
				<textarea bind:value={description} />
			</div>
			<p>Describe task:</p>
			<div class="margins">
				<textarea bind:value={description} />
			</div>
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				on:click={() => (showResults = true)}>
				<Label>Search</Label>
			</Button>
		</div>
		{#if showResults}
			<div id="results">
				<div id="result">
					<p>Datasets:</p>
					<ul>
						<li>Hell o world</li>
						<li>Hell o world</li>
						<li>Hell o world</li>
					</ul>
				</div>
				<div id="result">
					<p>Datasets:</p>
					<ul>
						<li>Hell o world</li>
						<li>Hell o world</li>
						<li>Hell o world</li>
					</ul>
				</div>
				<div id="result">
					<p>Datasets:</p>
					<ul>
						<li>Hell o world</li>
						<li>Hell o world</li>
						<li>Hell o world</li>
					</ul>
				</div>
			</div>
			<Button
				on:mouseleave={blur}
				on:focusout={blur}
				on:click={() => {
					tab.set("explore");
					window.location.hash = "/explore";
				}}>
				<Label>Create Project</Label>
			</Button>
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
	#start {
		width: 500px;
		height: 500px;
		background: white;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 50px;
		border-radius: 5px;
	}
	textarea {
		width: 300px;
		height: 50px;
	}
	img {
		margin-bottom: 20px;
	}
	#results {
		display: flex;
		flex-direction: inline;
	}
</style>
