<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas } from 'fabric';
	import { partList, parts } from '$lib/jscad/parts';
	import { toolList } from '$lib/jscad/tools';
	import { shapeList } from '$lib/jscad/shapes';
	import { rectangle, circle } from '$lib/jscad/shapes';
	import { tools } from '$lib/jscad/tools';
	import { addGrid, renderGeometry, enablePanZoom } from '$lib/jscad/2dCanvas';

	let canvasEl: HTMLCanvasElement;
	let fabricCanvas: Canvas;
	let geometry = parts.example2();
	onMount(() => {
		fabricCanvas = new Canvas(canvasEl, {
			backgroundColor: '#2a2a2a',
			selection: false
		});

		// Center the canvas at 0,0
		const vpt = fabricCanvas.viewportTransform;
		vpt[4] = fabricCanvas.width / 2;
		vpt[5] = fabricCanvas.height / 2;
		fabricCanvas.requestRenderAll();

		// Add grid
		addGrid(fabricCanvas);

		// Render geometry
		renderGeometry(fabricCanvas, geometry);

		// Enable pan and zoom
		enablePanZoom(fabricCanvas);

		return () => fabricCanvas.dispose();
	});
</script>

<div class="container">
	<div class="header">
		<h1>Parts</h1>
	</div>
	<div class="menu">
		<h2>parts</h2>
		{#each partList as part}
			<p>{part.name}</p>
		{/each}
		<h2>tools</h2>
		{#each toolList as tool}
			<p>{tool.name}</p>
		{/each}
		<h2>shapes</h2>
		{#each shapeList as shape}
			<p>{shape.name}</p>
		{/each}
	</div>

	<div class="content">
		<canvas bind:this={canvasEl} width="800" height="600"></canvas>
		<div class="controls">
			<small>Scroll to zoom • Alt+drag to pan</small>
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-wrap: wrap;
		height: 100vh;
		background-color: #888;
	}

	.header {
		width: 100%;
		background-color: #333;
		max-height: 100px;
		padding-left: 10px;
		padding-right: 10px;
	}

	.menu {
		display: flex;
		flex-direction: column;
		max-width: 200px;
		min-width: 200px;
		width: 20%;
		padding-left: 10px;
		background-color: #444;
		height: calc(100vh - 100px);
		overflow-y: auto;
	}

	.content {
		flex: 1;
		background-color: #666;
		height: calc(100vh - 100px);
		padding: 10px;
		position: relative;
	}

	canvas {
		width: 100%;
		height: calc(100% - 30px);
	}

	.controls {
		position: absolute;
		bottom: 15px;
		left: 15px;
		color: #ccc;
		background-color: rgba(0, 0, 0, 0.5);
		padding: 5px 10px;
		border-radius: 4px;
	}

	h1 {
		color: #fff;
	}

	h2 {
		color: #aaa;
		font-size: 14px;
		margin-top: 15px;
		margin-bottom: 5px;
	}

	p {
		color: #ccc;
		font-size: 13px;
		margin: 3px 0;
		cursor: pointer;
	}

	p:hover {
		color: #fff;
	}
</style>
