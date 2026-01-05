import extrudePkg from '@jscad/modeling/src/operations/extrusions/index.js';
const { extrudeLinear } = extrudePkg;
import geom3Pkg from '@jscad/modeling/src/geometries/geom3/index.js';
const { toPolygons } = geom3Pkg;
import * as THREE from 'three';

/**
 * Extrudes a 2D geometry to 3D using JSCAD's extrudeLinear
 */
export function extrudeGeometry(
	geom2Param: any,
	height: number,
	twistAngle = 0,
	twistSteps = 1
): any {
	return extrudeLinear({ height, twistAngle, twistSteps }, geom2Param);
}

/**
 * Converts JSCAD 3D geometry to Three.js BufferGeometry
 */
export function jscadToThreeGeometry(geom3Param: any): THREE.BufferGeometry {
	const polygons = toPolygons(geom3Param);
	const geometry = new THREE.BufferGeometry();
	const positions: number[] = [];
	const indices: number[] = [];

	let vertexIndex = 0;

	for (const polygon of polygons) {
		const vertices = polygon.vertices;
		const numVertices = vertices.length;

		if (numVertices < 3) continue;

		const firstVertex = vertexIndex;
		vertices.forEach((vertex: any, i: number) => {
			positions.push(vertex[0], vertex[1], vertex[2]);
			if (i >= 2) {
				indices.push(firstVertex, vertexIndex - 1, vertexIndex);
			}
			vertexIndex++;
		});
	}

	geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();

	return geometry;
}

/**
 * Combined function: extrude and convert to Three.js
 */
export function extrudeToThree(
	geom2Param: any,
	height: number,
	twistAngle = 0,
	twistSteps = 1
): THREE.BufferGeometry {
	const extruded = extrudeGeometry(geom2Param, height, twistAngle, twistSteps);
	return jscadToThreeGeometry(extruded);
}
