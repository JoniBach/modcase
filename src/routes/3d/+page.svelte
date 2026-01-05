<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { parts, partList } from '$lib/jscad/parts';
	import { extrudeToThree } from '$lib/jscad/extrude';

	let canvas: HTMLCanvasElement;
	let selectedPart = partList[0].id; // default to first part
	let extrusionHeight = 5; // mm, default 5

	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let mesh: THREE.Mesh | null = null;

	onMount(() => {
		// Setup Three.js scene
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1a1a1a);

		// Camera
		const aspect = window.innerWidth / window.innerHeight;
		camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
		camera.position.set(50, 50, 50);

		// Renderer
		renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		// Controls
		controls = new OrbitControls(camera, canvas);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		// Lighting
		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 25);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.near = 0.5;
		directionalLight.shadow.camera.far = 500;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);

		// Initial render
		updateModel();

		// Animation loop
		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}
		animate();

		// Handle resize
		function onResize() {
			const width = window.innerWidth;
			const height = window.innerHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		}
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
			renderer.dispose();
		};
	});

	function updateModel() {
		if (mesh) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			(mesh.material as THREE.Material).dispose();
		}

		// Get 2D geometry from selected part
		const partFunc = (parts as any)[selectedPart];
		const geom2 = partFunc();

		// Extrude to 3D and convert to Three.js
		const geometry = extrudeToThree(geom2, extrusionHeight);

		// Create mesh with material
		const material = new THREE.MeshLambertMaterial({ color: 0x667eea });
		mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		// Center the mesh
		geometry.computeBoundingBox();
		if (geometry.boundingBox) {
			const center = geometry.boundingBox.getCenter(new THREE.Vector3());
			mesh.position.sub(center);
		}

		scene.add(mesh);
	}

	$: if (selectedPart || extrusionHeight) {
		if (scene) updateModel();
	}
</script>

<div class="viewer-container">
	<canvas bind:this={canvas}></canvas>

	<div class="controls">
		<div class="control-group">
			<label for="part-select">Select Part:</label>
			<select id="part-select" bind:value={selectedPart}>
				{#each partList as part}
					<option value={part.id}>{part.name}</option>
				{/each}
			</select>
		</div>

		<div class="control-group">
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

<style>
	.viewer-container {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.controls {
		position: absolute;
		top: 20px;
		left: 20px;
		background: rgba(0, 0, 0, 0.8);
		padding: 20px;
		border-radius: 8px;
		border: 1px solid #333;
		min-width: 250px;
	}

	.control-group {
		margin-bottom: 15px;
	}

	label {
		display: block;
		color: white;
		font-size: 14px;
		margin-bottom: 5px;
		font-family: sans-serif;
	}

	select,
	input[type='range'] {
		width: 100%;
		padding: 8px;
		border-radius: 4px;
		border: 1px solid #555;
		background: #222;
		color: white;
		font-size: 14px;
	}

	select:focus,
	input:focus {
		outline: none;
		border-color: #667eea;
	}
</style>
