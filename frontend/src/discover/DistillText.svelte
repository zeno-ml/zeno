<script lang="ts">
	import { postEndpointGenerator } from "../util/request";
	import Textfield from "@smui/textfield";
	import { Icon } from "@smui/icon-button";
	import Button from "@smui/button";
	import { model, transform } from "../stores";

	let clipText = "";
	const post = postEndpointGenerator("api/clip");

	interface DistillTextResponse {
		text?: string;
		column?: string;
		batches?: number;
	}
	/**
	 * Takes a text and connects it to the data embeddings via CLIP
	 * Note, this only works if embeddings is trained in a CLIP
	 * contrastive way
	 *
	 * Under the hood, it encodes the text into a vector, then inner products with each
	 * image encoding, and adds a new column
	 *
	 * Figure for this is in https://www.figma.com/file/NihagT5JR6t5niq8NSDQQG/distill-natural-language?node-id=0%3A1
	 */
	async function distillText(text: string) {
		const result = (await post({
			url: "distill",
			payload: { text, model: $model, transform: $transform },
		})) as DistillTextResponse;

		if (result) {
			console.log(result);
		}
	}
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
			on:click={async () => {
				await distillText(clipText);
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
