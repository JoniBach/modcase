import type { SketchPlane, Point3D } from './types';

export function createOriginPlanes(): Map<string, SketchPlane> {
	const planes = new Map<string, SketchPlane>();

	// XY Plane (Top view)
	planes.set('xy-plane', {
		id: 'xy-plane',
		name: 'XY Plane',
		origin: { x: 0, y: 0, z: 0 },
		normal: { x: 0, y: 0, z: 1 },
		xAxis: { x: 1, y: 0, z: 0 },
		yAxis: { x: 0, y: 1, z: 0 }
	});

	// XZ Plane (Front view)
	planes.set('xz-plane', {
		id: 'xz-plane',
		name: 'XZ Plane',
		origin: { x: 0, y: 0, z: 0 },
		normal: { x: 0, y: 1, z: 0 },
		xAxis: { x: 1, y: 0, z: 0 },
		yAxis: { x: 0, y: 0, z: 1 }
	});

	// YZ Plane (Right view)
	planes.set('yz-plane', {
		id: 'yz-plane',
		name: 'YZ Plane',
		origin: { x: 0, y: 0, z: 0 },
		normal: { x: 1, y: 0, z: 0 },
		xAxis: { x: 0, y: 1, z: 0 },
		yAxis: { x: 0, y: 0, z: 1 }
	});

	return planes;
}

export function worldToPlane(worldPoint: Point3D, plane: SketchPlane): { x: number; y: number } {
	const relX = worldPoint.x - plane.origin.x;
	const relY = worldPoint.y - plane.origin.y;
	const relZ = worldPoint.z - plane.origin.z;

	const x = relX * plane.xAxis.x + relY * plane.xAxis.y + relZ * plane.xAxis.z;
	const y = relX * plane.yAxis.x + relY * plane.yAxis.y + relZ * plane.yAxis.z;

	return { x, y };
}

export function planeToWorld(planePoint: { x: number; y: number }, plane: SketchPlane): Point3D {
	return {
		x: plane.origin.x + planePoint.x * plane.xAxis.x + planePoint.y * plane.yAxis.x,
		y: plane.origin.y + planePoint.x * plane.xAxis.y + planePoint.y * plane.yAxis.y,
		z: plane.origin.z + planePoint.x * plane.xAxis.z + planePoint.y * plane.yAxis.z
	};
}
