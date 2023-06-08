<script lang="ts">
	import { mdiPlus, mdiCheckCircle } from "@mdi/js";
	import Button from "@smui/button";
	import { Svg } from "@smui/common";
	import IconButton, { Icon } from "@smui/icon-button";
	import { clickOutside } from "../../util/clickOutside";
	import { ZenoService, type Slice } from "../../zenoservice";
	import SliceDetails from "../../general/SliceDetails.svelte";
	import Paper, { Content } from "@smui/paper";
	import Textfield from "@smui/textfield";
	import { slices } from "../../stores";
	import { deleteSlice } from "../../api/slice";

	export let slice: Slice;
	export let metric;
	export let size;

	let newSliceName = "";
	let createdSliceName = "";
	let showSliceName = false;
	let created = false;
	let input;

	$: if (showSliceName && input) {
		input.getElement().focus();
	}
	$: validSlice = newSliceName && !$slices.has(newSliceName);

	function addSlice() {
		slice.sliceName = newSliceName;
		ZenoService.createNewSlice(slice).then(() => {
			slices.update((s) => {
				s.set(newSliceName, slice);
				return s;
			});
		});
		createdSliceName = newSliceName;
		showSliceName = false;
		created = true;
	}
	function removeSlice() {
		slices.update((s) => {
			s.delete(createdSliceName);
			return s;
		});
		deleteSlice(createdSliceName);
		created = false;
	}
	function submit(e) {
		e.stopPropagation();
		if (validSlice && e.key === "Enter") {
			addSlice();
		}
		if (showSliceName && e.key === "Escape") {
			showSliceName = false;
		}
	}
</script>

<svelte:window on:keydown={submit} />

<div class="slice">
	<span style="display: inline-block;">
		<SliceDetails predicateGroup={slice.filterPredicates} />
	</span>
	<div style="display: flex; align-items: center;">
		<span style="margin-right: 10px; margin-left: 10px">
			{metric}
		</span>
		<span id="size">
			({size})
		</span>
		{#if created}
			<IconButton on:click={() => removeSlice()}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#6a1b9a" d={mdiCheckCircle} />
				</Icon>
			</IconButton>
		{:else}
			<IconButton
				on:click={() => {
					showSliceName = true;
				}}>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="#6a1b9a" d={mdiPlus} />
				</Icon>
			</IconButton>
		{/if}
	</div>
	{#if showSliceName}
		<div
			id="slice-name"
			on:keydown={submit}
			use:clickOutside
			on:click_outside={() => (showSliceName = false)}>
			<Paper elevation={7}>
				<Content style="display:flex; flex-direction:column">
					<Textfield
						bind:value={newSliceName}
						label="Slice Name"
						bind:this={input} />
					{#if $slices.has(newSliceName)}
						<p style="margin-right: 10px; color: red">Slice already exists!</p>
					{/if}
					<div class="buttons">
						<Button
							style="margin-left: 10px;"
							variant="outlined"
							on:click={() => (showSliceName = false)}
							>Cancel
						</Button>
						<Button
							style="margin-left: 5px;"
							variant="outlined"
							disabled={!validSlice}
							on:click={() => addSlice()}
							>{"Create"}
						</Button>
					</div>
				</Content>
			</Paper>
		</div>
	{/if}
</div>

<style>
	.slice {
		margin-left: 20px;
		display: flex;
		margin-top: 10px;
		margin-bottom: 10px;
		align-items: center;
		justify-content: space-between;
	}
	#slice-name {
		right: 30px;
		z-index: 5;
		position: absolute;
	}
	#size {
		font-style: italic;
		color: var(--G3);
		margin-right: 10px;
	}
	.buttons {
		margin-top: 10px;
	}
</style>
