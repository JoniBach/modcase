import pkg from '@jscad/modeling';

const { geometries, extrusions } = pkg;
const { geom2 } = geometries;
const { extrudeLinear, extrudeRotate } = extrusions;

export interface SketchShape {
	type: 'rectangle' | 'circle' | 'polygon' | 'path';
	points: [number, number][];
}

export interface ExtrusionOptions {
	height: number;
	twist?: number;
	scale?: number;
}

export interface RevolutionOptions {
	segments?: number;
	angle?: number;
}

export function convertCanvasToWorldCoordinates(
	canvasPoints: [number, number][],
	canvasWidth: number,
	canvasHeight: number,
	worldScale: number = 0.1
): [number, number][] {
	const centerX = canvasWidth / 2;
	const centerY = canvasHeight / 2;

	return canvasPoints.map(([x, y]) => {
		const worldX = (x - centerX) * worldScale;
		const worldY = (centerY - y) * worldScale;
		return [worldX, worldY];
	});
}

export function createClosedPath(points: [number, number][]): [number, number][] {
	if (points.length < 3) {
		throw new Error('A closed path requires at least 3 points');
	}

	const firstPoint = points[0];
	const lastPoint = points[points.length - 1];

	if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
		return [...points, firstPoint];
	}

	return points;
}

export function sketchToGeom2D(
	sketchData: SketchShape[],
	canvasWidth: number = 800,
	canvasHeight: number = 600
): unknown {
	if (sketchData.length === 0) {
		throw new Error('No sketch data provided');
	}

	const worldCoordinates = sketchData.map((shape) => {
		const worldPoints = convertCanvasToWorldCoordinates(shape.points, canvasWidth, canvasHeight);
		return createClosedPath(worldPoints);
	});

	const geom2DShapes = worldCoordinates.map((points) => {
		return geom2.fromPoints(points);
	});

	if (geom2DShapes.length === 1) {
		return geom2DShapes[0];
	}

	return geom2DShapes;
}

export function extrudeSketch(
	sketchData: SketchShape[],
	options: ExtrusionOptions,
	canvasWidth: number = 800,
	canvasHeight: number = 600
): unknown {
	const geom2D = sketchToGeom2D(sketchData, canvasWidth, canvasHeight);

	const extrusionParams: Record<string, unknown> = {
		height: options.height
	};

	if (options.twist !== undefined && options.twist !== 0) {
		extrusionParams.twistAngle = (options.twist * Math.PI) / 180;
		extrusionParams.twistSteps = 20;
	}

	if (options.scale !== undefined && options.scale !== 1) {
		extrusionParams.scale = [options.scale, options.scale];
	}

	if (Array.isArray(geom2D)) {
		return geom2D.map((g) => extrudeLinear(extrusionParams, g as never));
	}

	return extrudeLinear(extrusionParams, geom2D as never);
}

export function revolveSketch(
	sketchData: SketchShape[],
	options: RevolutionOptions = {},
	canvasWidth: number = 800,
	canvasHeight: number = 600
): unknown {
	const geom2D = sketchToGeom2D(sketchData, canvasWidth, canvasHeight);

	const revolutionParams: Record<string, unknown> = {
		segments: options.segments || 32
	};

	if (options.angle !== undefined) {
		revolutionParams.angle = (options.angle * Math.PI) / 180;
	}

	if (Array.isArray(geom2D)) {
		return geom2D.map((g) => extrudeRotate(revolutionParams, g as never));
	}

	return extrudeRotate(revolutionParams, geom2D as never);
}

export function validateSketchData(sketchData: SketchShape[]): { valid: boolean; error?: string } {
	if (!sketchData || sketchData.length === 0) {
		return { valid: false, error: 'No shapes in sketch' };
	}

	for (const shape of sketchData) {
		if (!shape.points || shape.points.length < 3) {
			return { valid: false, error: `Shape of type ${shape.type} has insufficient points` };
		}
	}

	return { valid: true };
}
