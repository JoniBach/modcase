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
	import { exportGroupToSTL } from '$lib/utils/stlExporter';
	import { serializeToSvg } from '$lib/utils/svgSerializer';

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

	function handleExport() {
		if (!scene) return;
		const meshes = scene.children.filter(
			(child) => child instanceof THREE.Mesh && !(child.material as THREE.Material).wireframe
		) as THREE.Mesh[];
		if (meshes.length === 0) return;
		const group = new THREE.Group();
		meshes.forEach((mesh) => group.add(mesh.clone()));
		const filename = `${currentPartId}_${extrusionHeight}mm.stl`;
		exportGroupToSTL(group, filename);
	}

	function handleSvgExport() {
		const svgString = serializeToSvg(geometry);
		const blob = new Blob([svgString], { type: 'image/svg+xml' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${currentPartId}.svg`;
		link.click();
		URL.revokeObjectURL(link.href);
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
			on:click={handleExport}
			on:keypress={(e) => e.key === 'Enter' && handleExport()}
			role="button"
			tabindex="0"
		>
			STL
		</p>
		<p
			on:click={handleSvgExport}
			on:keypress={(e) => e.key === 'Enter' && handleSvgExport()}
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
		<div class="view-2d">
			<canvas bind:this={canvasEl} width="400" height="400"></canvas>
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
	}

	.view-2d,
	.view-3d {
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
