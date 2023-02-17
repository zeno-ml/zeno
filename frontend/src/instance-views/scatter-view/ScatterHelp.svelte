<div id="instruction">
	<div><kbd>drag</kbd> to pan / move around</div>
	<div><kbd>scroll</kbd> to zoom</div>
	<div>
		<kbd>Shift</kbd> + <kbd>drag</kbd> to lasso select points
	</div>
	<div>
		<kbd>Esc</kbd> or double click to clear lasso selection
	</div>
</div>

<style>
	#instruction {
		display: flex;
		margin-top: 10px;
		gap: 18px;
		color: hsl(0, 0%, 50%);
		font-weight: 200;
	}
	/* credit to https://developer.mozilla.org/en-US/docs/Web/HTML/Element/kbd */
	kbd {
		background-color: var(--G5);
		border-radius: 3px;
		border: 1px solid var(--G3);
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2),
			0 2px 0 0 rgba(255, 255, 255, 0.7) inset;
		display: inline-block;
		color: var(--G1);
		font-size: 0.85em;
		font-weight: 550;
		line-height: 1;
		padding: 2px 4px;
		white-space: nowrap;
	}
</style>
