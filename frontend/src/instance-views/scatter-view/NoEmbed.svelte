<script lang="ts">
	import { model } from "../../stores";
</script>

{#if !$model}
	<h1>No model available for embeddings.</h1>
{:else}
	<h1>No embeddings for <code>{$model}</code></h1>
{/if}
<p>
	Where you return a batch of predictions from the model, you can also return a
	batch of embeddings. You can simply add it as the second return tuple value.
</p>
<p>
	See the <a
		href="https://github.com/zeno-ml/zeno/blob/main/examples/cifar/tests/loading.py#L42"
		><code>Github Zeno Cifar Example</code></a> to see how to return the embedding
	vectors during inference.
</p>
<p>
	For more information, check out the docs for <a
		href="https://zenoml.com/docs/api#model"><code>@model</code></a
	>.
</p>

<style>
	h1 {
		font-size: 1.5rem;
		font-weight: 500;
	}
</style>
