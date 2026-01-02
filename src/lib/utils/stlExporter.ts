import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function exportToSTL(geometry: THREE.BufferGeometry, filename: string = 'model.stl'): void {
	const stlString = generateSTL(geometry);
	const blob = new Blob([stlString], { type: 'text/plain' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	URL.revokeObjectURL(link.href);
}

function generateSTL(geometry: THREE.BufferGeometry): string {
	const vertices = geometry.attributes.position;
	const indices = geometry.index;

	let stl = 'solid exported\n';

	if (indices) {
		for (let i = 0; i < indices.count; i += 3) {
			const i1 = indices.getX(i);
			const i2 = indices.getX(i + 1);
			const i3 = indices.getX(i + 2);

			const v1 = new THREE.Vector3(vertices.getX(i1), vertices.getY(i1), vertices.getZ(i1));
			const v2 = new THREE.Vector3(vertices.getX(i2), vertices.getY(i2), vertices.getZ(i2));
			const v3 = new THREE.Vector3(vertices.getX(i3), vertices.getY(i3), vertices.getZ(i3));

			const normal = calculateNormal(v1, v2, v3);

			stl += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
			stl += '    outer loop\n';
			stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
			stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
			stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
			stl += '    endloop\n';
			stl += '  endfacet\n';
		}
	} else {
		for (let i = 0; i < vertices.count; i += 3) {
			const v1 = new THREE.Vector3(vertices.getX(i), vertices.getY(i), vertices.getZ(i));
			const v2 = new THREE.Vector3(
				vertices.getX(i + 1),
				vertices.getY(i + 1),
				vertices.getZ(i + 1)
			);
			const v3 = new THREE.Vector3(
				vertices.getX(i + 2),
				vertices.getY(i + 2),
				vertices.getZ(i + 2)
			);

			const normal = calculateNormal(v1, v2, v3);

			stl += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
			stl += '    outer loop\n';
			stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
			stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
			stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
			stl += '    endloop\n';
			stl += '  endfacet\n';
		}
	}

	stl += 'endsolid exported\n';
	return stl;
}

function calculateNormal(v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3): THREE.Vector3 {
	const edge1 = new THREE.Vector3().subVectors(v2, v1);
	const edge2 = new THREE.Vector3().subVectors(v3, v1);
	const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
	return normal;
}

export function exportGroupToSTL(group: THREE.Group, filename: string = 'model.stl'): void {
	const geometries: THREE.BufferGeometry[] = [];

	group.traverse((child) => {
		if (child instanceof THREE.Mesh && child.geometry) {
			const clonedGeometry = child.geometry.clone();
			clonedGeometry.applyMatrix4(child.matrixWorld);
			geometries.push(clonedGeometry);
		}
	});

	if (geometries.length > 0) {
		const merged = mergeGeometries(geometries, false);
		if (merged) {
			exportToSTL(merged, filename);
		}
	}
}
