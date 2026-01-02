import pkg from '@jscad/modeling';
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

function stlDataToJSCAD(stlData: any): any {
	const polygons: any[] = [];

	for (let i = 0; i < stlData.triangleCount; i++) {
		const baseIndex = i * 9;
		const vertices = [
			[
				stlData.vertices[baseIndex],
				stlData.vertices[baseIndex + 1],
				stlData.vertices[baseIndex + 2]
			],
			[
				stlData.vertices[baseIndex + 3],
				stlData.vertices[baseIndex + 4],
				stlData.vertices[baseIndex + 5]
			],
			[
				stlData.vertices[baseIndex + 6],
				stlData.vertices[baseIndex + 7],
				stlData.vertices[baseIndex + 8]
			]
		];

		polygons.push({ vertices });
	}

	return geom3.create(polygons);
}
