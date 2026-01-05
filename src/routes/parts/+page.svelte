<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { Canvas } from 'fabric';
	import { partList, parts } from '$lib/jscad/parts';
	import { toolList } from '$lib/jscad/tools';
	import { shapeList } from '$lib/jscad/shapes';
	import { rectangle, circle } from '$lib/jscad/shapes';
	import { tools } from '$lib/jscad/tools';
	import { addGrid, renderGeometry, enablePanZoom } from '$lib/jscad/2dCanvas';
	import { setUnitConfig, getUnitConfig, type Unit, unitsList } from '$lib/jscad/units';
	import { setup3DCanvas, render3DGeometry } from '$lib/jscad/3dCanvas';
	import * as THREE from 'three';

	let canvasEl: HTMLCanvasElement;
	let canvas3d: HTMLCanvasElement;
	let fabricCanvas: Canvas;
	let currentPartId = 'mixedUnits';
	let geometry = parts.mixedUnits();
	let selectedUnit: Unit = 'mm';
	let gridSpacing = 10;
	let showConfig = false;
	let extrusionHeight = 5; // mm

	// 3D variables
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;

	// Initialize from URL parameters
	function initializeFromUrl() {
		const urlParams = get(page).url.searchParams;

		// Load part from URL
		const partParam = urlParams.get('part');
		if (partParam && partList.some((p) => p.id === partParam)) {
			currentPartId = partParam;
			geometry = parts[currentPartId as keyof typeof parts]();
		}

		// Load unit from URL
		const unitParam = urlParams.get('unit');
		if (unitParam && unitsList.includes(unitParam as Unit)) {
			selectedUnit = unitParam as Unit;
		}

		// Load height from URL
		const heightParam = urlParams.get('height');
		if (heightParam) {
			const h = parseFloat(heightParam);
			if (!isNaN(h) && h >= 1 && h <= 20) {
				extrusionHeight = h;
			}
		}
	}

	// Update URL with current parameters
	function updateUrl() {
		const url = new URL(window.location.href);
		url.searchParams.set('part', currentPartId);
		url.searchParams.set('unit', selectedUnit);
		url.searchParams.set('height', extrusionHeight.toString());
		window.history.replaceState({}, '', url.toString());
	}

	onMount(() => {
		initializeFromUrl();
		updateUrl();

		// 2D setup
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

		// 3D setup
		const { scene: s, renderer: r, animate } = setup3DCanvas(canvas3d);
		scene = s;
		renderer = r;
		animate();

		return () => {
			fabricCanvas.dispose();
			if (renderer) renderer.dispose();
		};
	});

	function updateUnitConfig() {
		setUnitConfig({
			defaultUnit: selectedUnit,
			gridSpacing: gridSpacing
		});
		if (fabricCanvas) {
			addGrid(fabricCanvas);
		}
	}

	function refreshGeometry() {
		if (fabricCanvas) {
			const partFunc = parts[currentPartId as keyof typeof parts];
			if (typeof partFunc === 'function') {
				geometry = partFunc();
				renderGeometry(fabricCanvas, geometry);
				render3DGeometry(scene, geometry, extrusionHeight);
			}
		}
	}

	function selectPart(partId: string) {
		currentPartId = partId;
		updateUrl();
		refreshGeometry();
	}

	// Reactive update for 3D when height changes
	$: if (extrusionHeight && scene) {
		render3DGeometry(scene, geometry, extrusionHeight);
		updateUrl();
	}
</script>

<div class="container">
	<div class="header">
		<h1>Parts</h1>
	</div>

	<div class="menu">
		<h2>parts</h2>
		{#each partList as part}
			<p
				class:active={currentPartId === part.id}
				on:click={() => selectPart(part.id)}
				on:keypress={(e) => e.key === 'Enter' && selectPart(part.id)}
				role="button"
				tabindex="0"
			>
				{part.name}
			</p>
		{/each}
		<h2>tools</h2>
		{#each toolList as tool}
			<p>{tool.name}</p>
		{/each}
		<h2>shapes</h2>
		{#each shapeList as shape}
			<p>{shape.name}</p>
		{/each}

		<h2>units</h2>
		{#each unitsList as unit}
			<p
				class:active={selectedUnit === unit}
				on:click={() => {
					selectedUnit = unit;
					updateUnitConfig();
				}}
				on:keypress={(e) => e.key === 'Enter' && ((selectedUnit = unit), updateUnitConfig())}
				role="button"
				tabindex="0"
			>
				{unit}
			</p>
		{/each}
	</div>

	<div class="content">
		<div class="view-2d">
			<canvas bind:this={canvasEl} width="800" height="600"></canvas>
			<div class="controls">
				<small>Scroll to zoom • Alt+drag to pan</small>
			</div>
		</div>
		<div class="view-3d">
			<canvas bind:this={canvas3d}></canvas>
			<div class="controls-3d">
				<label for="height-slider">Extrusion Height: {extrusionHeight}mm</label>
				<input
					id="height-slider"
					type="range"
					min="1"
					max="20"
					step="0.5"
					bind:value={extrusionHeight}
				/>
			</div>
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
		padding: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.config-btn {
		background-color: #555;
		color: #fff;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
	}

	.config-btn:hover {
		background-color: #666;
	}

	.config-panel {
		width: 100%;
		background-color: #444;
		padding: 15px;
		border-bottom: 2px solid #555;
	}

	.config-panel h3 {
		color: #fff;
		margin-top: 0;
		margin-bottom: 15px;
		font-size: 16px;
	}

	.config-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	.config-row label {
		color: #ccc;
		min-width: 120px;
		font-size: 14px;
	}

	.config-row select,
	.config-row input {
		background-color: #555;
		color: #fff;
		border: 1px solid #666;
		padding: 6px 10px;
		border-radius: 4px;
		font-size: 14px;
	}

	.config-row input[type='number'] {
		width: 80px;
	}

	.unit-label {
		color: #aaa;
		font-size: 14px;
	}

	.refresh-btn {
		background-color: #4a9eff;
		color: #fff;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		margin-top: 10px;
	}

	.refresh-btn:hover {
		background-color: #5aafff;
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
		position: relative;
		display: flex;
	}

	.view-2d,
	.view-3d {
		flex: 1;
		position: relative;
	}

	.view-2d canvas {
		width: 100%;
		height: calc(100% - 30px);
	}

	.view-3d canvas {
		width: 100%;
		height: 100%;
	}

	.controls-3d {
		position: absolute;
		bottom: 15px;
		left: 15px;
		color: #ccc;
		background-color: rgba(0, 0, 0, 0.5);
		padding: 10px;
		border-radius: 4px;
		min-width: 200px;
	}

	.controls-3d label {
		display: block;
		font-size: 14px;
		margin-bottom: 5px;
	}

	.controls-3d input[type='range'] {
		width: 100%;
		background-color: #555;
		border: 1px solid #666;
		border-radius: 4px;
		height: 6px;
		-webkit-appearance: none;
		appearance: none;
	}

	.controls-3d input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #4a9eff;
		cursor: pointer;
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

	p.active {
		background-color: #555;
		color: #4aff9e;
		padding: 5px 8px;
		margin-left: -8px;
		border-radius: 4px;
	}
</style>
