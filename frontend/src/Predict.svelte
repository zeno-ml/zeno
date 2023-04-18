<script lang="ts"></script>

<main>
	<iframe
		title="Gradio instance prediction UI"
		src={location.protocol +
			"//" +
			location.host +
			location.pathname +
			"api/gradio"} />
</main>

<style>
	main {
		padding: 20px;
		height: calc(100% - 40px);
	}
	iframe {
		border: 0px;
		width: 100%;
		height: calc(100% - 40px);
	}
</style>
