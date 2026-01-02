import * as THREE from 'three';

export interface STLData {
	vertices: Float32Array;
	normals: Float32Array;
	triangleCount: number;
}

export function parseSTL(arrayBuffer: ArrayBuffer): STLData | null {
	const view = new DataView(arrayBuffer);

	if (isBinarySTL(arrayBuffer)) {
		return parseBinarySTL(view);
	} else {
		return parseAsciiSTL(arrayBuffer);
	}
}

function isBinarySTL(arrayBuffer: ArrayBuffer): boolean {
	const view = new DataView(arrayBuffer);

	if (arrayBuffer.byteLength < 84) {
		return false;
	}

	const triangleCount = view.getUint32(80, true);
	const expectedSize = 84 + triangleCount * 50;

	if (arrayBuffer.byteLength === expectedSize) {
		return true;
	}

	const text = new TextDecoder().decode(arrayBuffer.slice(0, 5));
	return text.toLowerCase() !== 'solid';
}

function parseBinarySTL(view: DataView): STLData {
	const triangleCount = view.getUint32(80, true);

	const vertices = new Float32Array(triangleCount * 9);
	const normals = new Float32Array(triangleCount * 9);

	let offset = 84;

	for (let i = 0; i < triangleCount; i++) {
		const normalX = view.getFloat32(offset, true);
		const normalY = view.getFloat32(offset + 4, true);
		const normalZ = view.getFloat32(offset + 8, true);
		offset += 12;

		for (let j = 0; j < 3; j++) {
			const vertexIndex = i * 9 + j * 3;

			vertices[vertexIndex] = view.getFloat32(offset, true);
			vertices[vertexIndex + 1] = view.getFloat32(offset + 4, true);
			vertices[vertexIndex + 2] = view.getFloat32(offset + 8, true);
			offset += 12;

			normals[vertexIndex] = normalX;
			normals[vertexIndex + 1] = normalY;
			normals[vertexIndex + 2] = normalZ;
		}

		offset += 2;
	}

	return {
		vertices,
		normals,
		triangleCount
	};
}

function parseAsciiSTL(arrayBuffer: ArrayBuffer): STLData | null {
	const text = new TextDecoder().decode(arrayBuffer);
	const lines = text.split('\n');

	const vertices: number[] = [];
	const normals: number[] = [];
	let currentNormal: number[] = [];
	let triangleCount = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (line.startsWith('facet normal')) {
			const parts = line.split(/\s+/);
			currentNormal = [parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4])];
		} else if (line.startsWith('vertex')) {
			const parts = line.split(/\s+/);
			vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
			normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
		} else if (line.startsWith('endfacet')) {
			triangleCount++;
		}
	}

	return {
		vertices: new Float32Array(vertices),
		normals: new Float32Array(normals),
		triangleCount
	};
}

export function stlToThreeGeometry(stlData: STLData): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry();

	geometry.setAttribute('position', new THREE.BufferAttribute(stlData.vertices, 3));
	geometry.setAttribute('normal', new THREE.BufferAttribute(stlData.normals, 3));

	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();

	return geometry;
}

export async function loadSTLFile(file: File): Promise<THREE.BufferGeometry> {
	const arrayBuffer = await file.arrayBuffer();
	const stlData = parseSTL(arrayBuffer);

	if (!stlData) {
		throw new Error('Failed to parse STL file');
	}

	return stlToThreeGeometry(stlData);
}

export async function loadSTLFromURL(url: string): Promise<THREE.BufferGeometry> {
	const response = await fetch(url);
	const arrayBuffer = await response.arrayBuffer();
	const stlData = parseSTL(arrayBuffer);

	if (!stlData) {
		throw new Error('Failed to parse STL file');
	}

	return stlToThreeGeometry(stlData);
}
