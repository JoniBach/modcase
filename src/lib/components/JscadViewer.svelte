<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { exportGroupToSTL } from '$lib/utils/stlExporter';

	let container: HTMLDivElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: OrbitControls;
	let currentMesh: THREE.Group | null = null;

	export let geometry: any = null;

	export function exportSTL(filename: string = 'model.stl') {
		if (currentMesh) {
			exportGroupToSTL(currentMesh, filename);
		}
	}

	export function loadSTLGeometry(geometry: THREE.BufferGeometry) {
		if (!scene) return;

		if (currentMesh) {
			scene.remove(currentMesh);
			currentMesh.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			});
		}

		const group = new THREE.Group();

		const material = new THREE.MeshPhongMaterial({
			color: 0x4a9eff,
			side: THREE.DoubleSide,
			flatShading: false
		});

		const mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);

		const edges = new THREE.EdgesGeometry(geometry);
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
		const wireframe = new THREE.LineSegments(edges, lineMaterial);
		group.add(wireframe);

		scene.add(group);
		currentMesh = group;

		const box = new THREE.Box3().setFromObject(group);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const fov = camera.fov * (Math.PI / 180);
		let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
		cameraZ *= 1.5;

		camera.position.set(cameraZ, cameraZ, cameraZ);
		camera.lookAt(center);
		controls.target.copy(center);
		controls.update();
	}

	onMount(() => {
		initScene();
		animate();

		return () => {
			if (renderer) {
				renderer.dispose();
			}
			if (controls) {
				controls.dispose();
			}
		};
	});

	function initScene() {
		scene = new THREE.Scene();
		scene.background = new THREE.Color(0x1a1a1a);

		camera = new THREE.PerspectiveCamera(
			45,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);
		camera.position.set(50, 50, 50);
		camera.lookAt(0, 0, 0);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		container.appendChild(renderer.domElement);

		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 10);
		scene.add(directionalLight);

		const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
		scene.add(gridHelper);

		const axesHelper = new THREE.AxesHelper(20);
		scene.add(axesHelper);

		window.addEventListener('resize', handleResize);
	}

	function handleResize() {
		if (!container || !camera || !renderer) return;

		camera.aspect = container.clientWidth / container.clientHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(container.clientWidth, container.clientHeight);
	}

	function animate() {
		requestAnimationFrame(animate);
		if (controls) controls.update();
		if (renderer && scene && camera) {
			renderer.render(scene, camera);
		}
	}

	export function updateGeometry(geom: any) {
		if (!scene) return;

		if (currentMesh) {
			scene.remove(currentMesh);
			currentMesh.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (Array.isArray(child.material)) {
						child.material.forEach((m) => m.dispose());
					} else {
						child.material.dispose();
					}
				}
			});
		}

		if (!geom) return;

		const group = new THREE.Group();

		if (Array.isArray(geom)) {
			geom.forEach((g) => addGeometryToGroup(g, group));
		} else {
			addGeometryToGroup(geom, group);
		}

		scene.add(group);
		currentMesh = group;

		const box = new THREE.Box3().setFromObject(group);
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z);
		const fov = camera.fov * (Math.PI / 180);
		let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
		cameraZ *= 1.5;

		camera.position.set(cameraZ, cameraZ, cameraZ);
		camera.lookAt(center);
		controls.target.copy(center);
		controls.update();
	}

	function addGeometryToGroup(geom: any, group: THREE.Group) {
		if (!geom.polygons) return;

		const vertices: number[] = [];
		const indices: number[] = [];
		let vertexIndex = 0;

		geom.polygons.forEach((polygon: any) => {
			const firstVertex = vertexIndex;
			polygon.vertices.forEach((vertex: any, i: number) => {
				vertices.push(vertex[0], vertex[1], vertex[2]);
				if (i >= 2) {
					indices.push(firstVertex, vertexIndex - 1, vertexIndex);
				}
				vertexIndex++;
			});
		});

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		const material = new THREE.MeshPhongMaterial({
			color: 0x4a9eff,
			side: THREE.DoubleSide,
			flatShading: false
		});

		const mesh = new THREE.Mesh(geometry, material);
		group.add(mesh);

		const edges = new THREE.EdgesGeometry(geometry);
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
		const wireframe = new THREE.LineSegments(edges, lineMaterial);
		group.add(wireframe);
	}

	$: if (geometry && scene) {
		updateGeometry(geometry);
	}
</script>

<div bind:this={container} class="viewer-container"></div>

<style>
	.viewer-container {
		width: 100%;
		height: 100%;
		min-height: 600px;
		position: relative;
	}

	:global(.viewer-container canvas) {
		display: block;
	}
</style>
