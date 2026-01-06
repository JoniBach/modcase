import pkg from '@jscad/modeling';
import type { Geom3, Poly3 } from '@jscad/modeling';
import { parseSTL } from '$lib/utils/stlParser';

const { geometries } = pkg;
const { geom3 } = geometries;

export async function createExtrusion1515() {
	const stlUrl = '/src/lib/assets/extrusion_1515.stl';

	const response = await fetch(stlUrl);
	const arrayBuffer = await response.arrayBuffer();
	const stlData = parseSTL(arrayBuffer);

	if (!stlData) {
		throw new Error('Failed to parse STL');
	}

	return stlDataToJSCAD(stlData);
}

function stlDataToJSCAD(stlData: unknown): Geom3 {
	const polygons: Poly3[] = [];
	const stl = stlData as { triangleCount: number; vertices: number[] };

	for (let i = 0; i < stl.triangleCount; i++) {
		const baseIndex = i * 9;
		const vertices = [
			[stl.vertices[baseIndex], stl.vertices[baseIndex + 1], stl.vertices[baseIndex + 2]],
			[stl.vertices[baseIndex + 3], stl.vertices[baseIndex + 4], stl.vertices[baseIndex + 5]],
			[stl.vertices[baseIndex + 6], stl.vertices[baseIndex + 7], stl.vertices[baseIndex + 8]]
		];

		polygons.push({ vertices });
	}

	return geom3.create(polygons);
}
