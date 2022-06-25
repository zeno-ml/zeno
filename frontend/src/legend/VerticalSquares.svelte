<script lang="ts">
	export let style = "";
	export let width = 225;
	export let height = 300;
	export let squareWidth = 10;
	export let colors = ["red", "salmon"];
	export let gap = 0;

	$: gaps = colors.length - 1;
	$: squareHeight = height / colors.length - (gap * gaps) / colors.length;
	$: gapsOffset = gap / gaps;
	$: {
		if (squareHeight <= 0) {
			throw new Error(
				"Height is 0 or negative for the Legend Square! You should probably have a smaller gap size or larger height."
			);
		}
	}
</script>

<svg {style} {width} {height}>
	{#each colors as c, i}
		<rect
			x={0}
			y={i * squareHeight + i * gapsOffset * gaps}
			width={squareWidth}
			height={squareHeight}
			fill={c}
		/>
	{/each}
</svg>
