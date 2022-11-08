<script lang="ts">
	import Textfield from "@smui/textfield";
	import { Icon } from "@smui/icon-button";
	import Button from "@smui/button";

	let clipText = "";
</script>

<div id="clip-text">
	<div id="clip-input">
		<Textfield label="Text Description" bind:value={clipText}>
			<Icon class="material-icons" slot="leadingIcon">format_quote</Icon>
		</Textfield>
	</div>
	<div id="clip-submit">
		<Button
			variant="outlined"
			on:click={() => {
				console.log(clipText);
			}}>Show on Data</Button>
	</div>
</div>

<style>
	#clip-text {
		padding: 0 20px;
		display: flex;
		align-items: end;
		gap: 20px;
	}
	#clip-input {
	}
	#clip-submit {
	}
</style>
