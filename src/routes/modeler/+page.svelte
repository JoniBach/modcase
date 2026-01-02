<script lang="ts">
	import ParametricModeler from '$lib/components/ParametricModeler.svelte';
</script>

<svelte:head>
	<title>Parametric 3D Modeler</title>
</svelte:head>

<ParametricModeler />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
