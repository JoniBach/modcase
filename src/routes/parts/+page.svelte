<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { Canvas } from 'fabric';
	import { partList, parts } from '$lib/jscad/parts';
	import { toolList } from '$lib/jscad/tools';
	import { shapeList } from '$lib/jscad/shapes';
	import { addGrid, renderGeometry, enablePanZoom } from '$lib/jscad/2dCanvas';
	import { setUnitConfig, type Unit, unitsList } from '$lib/jscad/units';
	import { setup3DCanvas, render3DGeometry } from '$lib/jscad/3dCanvas';
	import * as THREE from 'three';
	import { fileExports } from '$lib/jscad/fileExports';

	let canvasEl: HTMLCanvasElement;
	let canvas3d: HTMLCanvasElement;
	let view2d: HTMLElement;
	let fabricCanvas: Canvas;
	let currentPartId = 'mixedUnits';
	let geometry = parts.mixedUnits();
	let selectedUnit: Unit = 'mm';
	let gridSpacing = 10;
	let showConfig = false;
	let extrusionHeight = 5; // mm
	let currentZoom = 1;
	let panX = 400;
	let panY = 400;

	// 3D variables
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let updateSize: (width: number, height: number) => void;

	// Initialize from URL parameters
	function initializeFromUrl() {
		const urlParams = get(page).url.searchParams;

		// Parameter configurations for DRY loading
		const paramConfigs = [
			{
				key: 'part',
				validator: (s: string) => (partList.some((p) => p.id === s) ? s : null),
				setter: (v: string) => {
					currentPartId = v;
					geometry = parts[v as keyof typeof parts]();
				}
			},
			{
				key: 'unit',
				validator: (s: string) => (unitsList.includes(s as Unit) ? (s as Unit) : null),
				setter: (v: Unit) => {
					selectedUnit = v;
				}
			},
			{
				key: 'height',
				validator: (s: string) => {
					const h = parseFloat(s);
					return !isNaN(h) && h >= 1 && h <= 20 ? h : null;
				},
				setter: (v: number) => {
					extrusionHeight = v;
				}
			},
			{
				key: 'zoom',
				validator: (s: string) => {
					const z = parseFloat(s);
					return !isNaN(z) && z >= 0.1 ? z : null;
				},
				setter: (v: number) => {
					currentZoom = v;
				}
			},
			{
				key: 'panX',
				validator: (s: string) => {
					const x = parseFloat(s);
					return !isNaN(x) ? x : null;
				},
				setter: (v: number) => {
					panX = v;
				}
			},
			{
				key: 'panY',
				validator: (s: string) => {
					const y = parseFloat(s);
					return !isNaN(y) ? y : null;
				},
				setter: (v: number) => {
					panY = v;
				}
			}
		];

		// Load each parameter using the configs
		paramConfigs.forEach((config) => {
			const value = urlParams.get(config.key);
			if (value) {
				const parsed = config.validator(value);
				if (parsed !== null) {
					config.setter(parsed);
				}
			}
		});
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

		// Set initial canvas size
		fabricCanvas.setDimensions({ width: view2d.clientWidth, height: view2d.clientHeight });

		// Add grid
		addGrid(fabricCanvas);

		// Render geometry
		renderGeometry(fabricCanvas, geometry);

		// Enable pan and zoom
		enablePanZoom(fabricCanvas);

		// Apply initial zoom and pan from URL
		fabricCanvas.setViewportTransform([
			currentZoom,
			0,
			0,
			currentZoom,
			fabricCanvas.width / 2 - panX * currentZoom,
			fabricCanvas.height / 2 - panY * currentZoom
		]);
		addGrid(fabricCanvas);

		// 3D setup
		const { scene: s, renderer: r, animate, updateSize: us } = setup3DCanvas(canvas3d);
		scene = s;
		renderer = r;
		updateSize = us;
		animate();

		// Handle canvas resize
		const resizeObserver = new ResizeObserver(() => {
			if (updateSize) {
				updateSize(canvas3d.clientWidth, canvas3d.clientHeight);
			}
			if (fabricCanvas) {
				fabricCanvas.setDimensions({ width: view2d.clientWidth, height: view2d.clientHeight });
				addGrid(fabricCanvas);
			}
		});
		resizeObserver.observe(canvas3d);
		resizeObserver.observe(view2d);

		return () => {
			fabricCanvas.dispose();
			if (renderer) renderer.dispose();
			resizeObserver.disconnect();
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
		<h2>export</h2>
		<p
			on:click={() => fileExports.stl({ children: scene.children, partId: currentPartId })}
			on:keypress={(e) =>
				e.key === 'Enter' && fileExports.stl({ children: scene.children, partId: currentPartId })}
			role="button"
			tabindex="0"
		>
			STL
		</p>
		<p
			on:click={() => fileExports.svg({ geometry, partId: currentPartId })}
			on:keypress={(e) => e.key === 'Enter' && fileExports.svg({ geometry, partId: currentPartId })}
			role="button"
			tabindex="0"
		>
			SVG
		</p>
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
		<div class="view-2d" bind:this={view2d}>
			<canvas bind:this={canvasEl} width="800" height="800"></canvas>
		</div>
		<div class="view-3d">
			<canvas bind:this={canvas3d}></canvas>
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
		flex-direction: row;
	}

	.view-2d,
	.view-3d {
		position: relative;
		flex: 1;
	}

	.view-2d canvas {
		width: 100%;
		height: calc(100% - 30px);
	}

	.view-3d canvas {
		width: 100%;
		height: 100%;
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
