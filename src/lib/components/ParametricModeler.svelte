<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { Part, Sketch, SketchPlane } from '../sketch/types';
	import { createOriginPlanes } from '../sketch/SketchPlane';
	import { ExtrudeCommand } from '../features/ExtrudeFeature';
	import FeatureTree from './FeatureTree.svelte';
	import SimpleSketchCanvas from './SimpleSketchCanvas.svelte';

	let container: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let planeHelpers: Map<string, THREE.GridHelper> = new Map();

	let part: Part = {
		planes: createOriginPlanes(),
		sketches: new Map(),
		features: [],
		bodies: []
	};

	let isSketchMode = false;
	let currentSketch: Sketch | null = null;
	let currentPlane: SketchPlane | null = null;
	let selectingPlane = false;
	let extrudeCommand = new ExtrudeCommand();

	let animationFrameId: number;

	onMount(() => {
		// Wait for container to be available
		setTimeout(() => {
			if (container) {
				initScene();
				createOriginPlaneHelpers();
				startAnimation();
			}
		}, 100);

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			if (renderer) {
				renderer.dispose();
			}
		};
	});

	function initScene() {
		console.log('initScene called, container:', container);
		console.log('Container dimensions:', container?.clientWidth, container?.clientHeight);

		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x2a2a2a);

		camera = new THREE.PerspectiveCamera(
			75,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.set(5, 5, 5);
		camera.lookAt(0, 0, 0);
		console.log('Camera created at position:', camera.position);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(renderer.domElement);
		console.log('Renderer created and appended to container');

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 10);
		scene.add(directionalLight);

		const axesHelper = new THREE.AxesHelper(5);
		scene.add(axesHelper);
		console.log('Lights and axes added to scene');

		window.addEventListener('resize', handleResize);
	}

	function createOriginPlaneHelpers() {
		console.log('Creating origin plane helpers, planes:', part.planes.size);
		for (const [id, plane] of part.planes) {
			const gridHelper = new THREE.GridHelper(10, 10, 0x667eea, 0x444444);

			if (id === 'xz-plane') {
				gridHelper.rotation.x = Math.PI / 2;
			} else if (id === 'yz-plane') {
				gridHelper.rotation.z = Math.PI / 2;
			}

			gridHelper.userData.planeId = id;
			scene.add(gridHelper);
			planeHelpers.set(id, gridHelper);
			console.log('Added grid helper for plane:', id);
		}
		console.log('Total grid helpers added:', planeHelpers.size);
		console.log('Scene children count:', scene.children.length);
	}

	function startAnimation() {
		animate();
	}

	function animate() {
		animationFrameId = requestAnimationFrame(animate);
		if (controls && renderer && scene && camera) {
			controls.update();
			renderer.render(scene, camera);
		}
	}

	function handleResize() {
		if (!container) return;
		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	function startNewSketch() {
		selectingPlane = true;
		highlightPlanes(true);
	}

	function highlightPlanes(highlight: boolean) {
		for (const helper of planeHelpers.values()) {
			if (highlight) {
				(helper.material as THREE.Material).opacity = 0.8;
			} else {
				(helper.material as THREE.Material).opacity = 0.3;
			}
		}
	}

	function handlePlaneSelect(planeId: string) {
		if (!selectingPlane) return;

		const plane = part.planes.get(planeId);
		if (!plane) return;

		currentPlane = plane;
		currentSketch = createNewSketch(planeId);
		part.sketches.set(currentSketch.id, currentSketch);

		enterSketchMode();
		selectingPlane = false;
		highlightPlanes(false);
	}

	function createNewSketch(planeId: string): Sketch {
		return {
			id: `sketch-${Date.now()}`,
			planeId,
			points: new Map(),
			lines: new Map(),
			arcs: new Map(),
			circles: new Map(),
			constraints: new Map(),
			dimensions: new Map(),
			profiles: []
		};
	}

	function enterSketchMode() {
		isSketchMode = true;

		if (currentPlane) {
			animateCameraToPlane(currentPlane);
		}

		for (const helper of planeHelpers.values()) {
			if (helper.userData.planeId !== currentPlane?.id) {
				helper.visible = false;
			}
		}
	}

	function exitSketchMode() {
		console.log('exitSketchMode called');
		console.log('Current sketch mode:', isSketchMode);
		console.log('Current sketch data:', currentSketch);

		try {
			// Trigger Svelte reactivity by reassigning part
			part = part;
			console.log('Part sketches count:', part.sketches.size);

			isSketchMode = false;
			currentSketch = null;
			currentPlane = null;

			// Restore plane visibility
			for (const helper of planeHelpers.values()) {
				helper.visible = true;
			}

			// Reset camera only if camera and controls exist
			if (camera && controls) {
				camera.position.set(5, 5, 5);
				camera.lookAt(0, 0, 0);
				controls.target.set(0, 0, 0);
				controls.update();
			}

			console.log('Sketch mode exited, returning to 3D view');
		} catch (error) {
			console.error('Error exiting sketch mode:', error);
		}
	}

	function animateCameraToPlane(plane: SketchPlane) {
		const distance = 10;
		const targetPosition = new THREE.Vector3(
			plane.origin.x + plane.normal.x * distance,
			plane.origin.y + plane.normal.y * distance,
			plane.origin.z + plane.normal.z * distance
		);

		camera.position.copy(targetPosition);
		camera.lookAt(plane.origin.x, plane.origin.y, plane.origin.z);
		controls.target.set(plane.origin.x, plane.origin.y, plane.origin.z);
	}

	function handleExtrude() {
		if (!currentSketch || !currentPlane) return;

		const profileIds = currentSketch.profiles.filter((p) => !p.isHole).map((p) => p.id);

		if (profileIds.length === 0) {
			alert('No closed profiles found. Draw a closed shape first.');
			return;
		}

		const distance = parseFloat(prompt('Enter extrude distance (mm):', '10') || '10');

		const { feature, body } = extrudeCommand.execute(
			currentSketch,
			currentPlane,
			profileIds,
			distance,
			THREE
		);

		part.features.push(feature);
		part.bodies.push(body);
		scene.add(body.mesh);

		exitSketchMode();
		part = part;
	}

	function handleSelectPlane(planeId: string) {
		handlePlaneSelect(planeId);
	}

	function handleSelectSketch(sketchId: string) {
		const sketch = part.sketches.get(sketchId);
		if (!sketch) return;

		currentSketch = sketch;
		currentPlane = part.planes.get(sketch.planeId) || null;
		enterSketchMode();
	}

	function handleSelectFeature(featureId: string) {
		console.log('Selected feature:', featureId);
	}
</script>

<div class="parametric-modeler">
	<div class="top-toolbar">
		<div class="toolbar-left">
			<button class="primary-btn" on:click={startNewSketch} disabled={isSketchMode}>
				New Sketch
			</button>
			{#if isSketchMode && currentSketch && currentSketch.profiles.length > 0}
				<button class="primary-btn extrude-btn" on:click={handleExtrude}> Extrude </button>
			{/if}
		</div>
		<div class="toolbar-center">
			<h2>Parametric 3D Modeler</h2>
		</div>
		<div class="toolbar-right">
			{#if selectingPlane}
				<span class="status-message">Click a plane to start sketching...</span>
			{/if}
		</div>
	</div>

	<div class="main-layout">
		<FeatureTree
			{part}
			onSelectPlane={handleSelectPlane}
			onSelectSketch={handleSelectSketch}
			onSelectFeature={handleSelectFeature}
		/>

		<div class="viewport-container">
			<div
				bind:this={container}
				class="three-viewport"
				style:display={isSketchMode ? 'none' : 'block'}
			></div>
			{#if isSketchMode && currentSketch && currentPlane}
				<div class="sketch-overlay">
					<SimpleSketchCanvas
						sketch={currentSketch}
						plane={currentPlane}
						onExitSketch={exitSketchMode}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.parametric-modeler {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #2a2a2a;
		overflow: hidden;
	}

	.top-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		border-bottom: 2px solid #667eea;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.toolbar-left,
	.toolbar-right {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex: 1;
	}

	.toolbar-right {
		justify-content: flex-end;
	}

	.toolbar-center {
		flex: 1;
		text-align: center;
	}

	.toolbar-center h2 {
		margin: 0;
		color: #e0e0e0;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.primary-btn {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.primary-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.extrude-btn {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.extrude-btn:hover {
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
	}

	.status-message {
		color: #667eea;
		font-weight: 600;
		font-size: 0.875rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.main-layout {
		flex: 1;
		display: flex;
		overflow: hidden;
	}

	.viewport-container {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.three-viewport {
		width: 100%;
		height: 100%;
	}

	.sketch-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: white;
		z-index: 10;
	}
</style>
