import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { extrudeToThree } from './extrude';

export interface ThreeSetup {
	scene: THREE.Scene;
	camera: THREE.Camera;
	renderer: THREE.WebGLRenderer;
	controls: OrbitControls;
	animate: () => void;
	updateSize: (width: number, height: number) => void;
}

export function setup3DCanvas(canvas: HTMLCanvasElement): ThreeSetup {
	// Setup Three.js scene
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x1a1a1a);

	// Camera
	const camera = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
	camera.position.set(0, 0, 50);

	// Renderer
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setSize(canvas.clientWidth, canvas.clientHeight);

	// Camera update function
	const updateSize = (width: number, height: number) => {
		renderer.setSize(width, height);
		const aspect = width / height;
		const frustumSize = 50; // Vertical half-size
		(camera as THREE.OrthographicCamera).left = -aspect * frustumSize;
		(camera as THREE.OrthographicCamera).right = aspect * frustumSize;
		(camera as THREE.OrthographicCamera).top = frustumSize;
		(camera as THREE.OrthographicCamera).bottom = -frustumSize;
		(camera as THREE.OrthographicCamera).updateProjectionMatrix();
	};

	// Initial camera setup
	updateSize(canvas.clientWidth, canvas.clientHeight);

	// Controls
	const controls = new OrbitControls(camera, canvas);

	// Lighting
	const ambientLight = new THREE.AmbientLight(0x404040, 1);
	scene.add(ambientLight);

	// Animation loop
	function animate() {
		requestAnimationFrame(animate);
		controls.update();
		renderer.render(scene, camera);
	}

	return { scene, camera, renderer, controls, animate, updateSize };
}

export function render3DGeometry(scene: THREE.Scene, geom: unknown, extrusionHeight: number) {
	// Clear the scene completely
	scene.clear();

	// Re-add lighting
	const ambientLight = new THREE.AmbientLight(0x404040, 1);
	scene.add(ambientLight);

	// Extrude to 3D and convert to Three.js
	const threeGeometry = extrudeToThree(geom, extrusionHeight);

	// Create mesh with material - solid fill
	const solidMaterial = new THREE.MeshBasicMaterial({ color: 0x667eea });
	const solidMesh = new THREE.Mesh(threeGeometry, solidMaterial);

	// Create mesh with material - wireframe
	const wireMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
	const wireMesh = new THREE.Mesh(threeGeometry, wireMaterial);

	// Center the meshes
	threeGeometry.computeBoundingBox();
	if (threeGeometry.boundingBox) {
		const center = threeGeometry.boundingBox.getCenter(new THREE.Vector3());
		solidMesh.position.sub(center);
		wireMesh.position.sub(center);
	}

	// Add to scene
	scene.add(solidMesh);
	scene.add(wireMesh);
}
