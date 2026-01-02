import pkg from '@jscad/modeling';
import { createExtrusion1515 } from './extrusion1515';
import {
	createExtrusion2020,
	createExtrusion1515Parametric,
	createExtrusion1010
} from './extrusion2020';

const { primitives, booleans, transforms, extrusions, colors } = pkg;

const { cube, sphere, cylinder, cuboid, cylinderElliptic } = primitives;
const { union, subtract, intersect } = booleans;
const { translate, rotate, scale } = transforms;
const { extrudeLinear, extrudeRotate } = extrusions;
const { colorize } = colors;

export function createCube() {
	return cube({ size: 10 });
}

export function createSphere() {
	return sphere({ radius: 8, segments: 32 });
}

export function createCylinder() {
	return cylinder({ radius: 6, height: 15, segments: 32 });
}

export function createComplexShape() {
	const base = cuboid({ size: [20, 20, 5] });
	const hole = cylinder({ radius: 4, height: 10, segments: 32 });
	const movedHole = translate([0, 0, 0], hole);

	const result = subtract(base, movedHole);

	const topSphere = sphere({ radius: 6, segments: 32 });
	const movedSphere = translate([0, 0, 8], topSphere);

	return union(result, movedSphere);
}

export function createGear() {
	const teeth = 12;
	const toothHeight = 2;
	const innerRadius = 8;
	const outerRadius = innerRadius + toothHeight;
	const thickness = 4;

	const baseCircle = cylinder({ radius: innerRadius, height: thickness, segments: 32 });

	const teeth_array = [];
	for (let i = 0; i < teeth; i++) {
		const angle = (i * 2 * Math.PI) / teeth;
		const tooth = cuboid({ size: [2, toothHeight * 2, thickness] });
		const movedTooth = translate(
			[
				Math.cos(angle) * (innerRadius + toothHeight / 2),
				Math.sin(angle) * (innerRadius + toothHeight / 2),
				0
			],
			rotate([0, 0, angle], tooth)
		);
		teeth_array.push(movedTooth);
	}

	const centerHole = cylinder({ radius: 3, height: thickness + 2, segments: 32 });
	const movedHole = translate([0, 0, -1], centerHole);

	return subtract(union(baseCircle, ...teeth_array), movedHole);
}

export function createHouse() {
	const walls = cuboid({ size: [20, 20, 15] });
	const movedWalls = translate([0, 0, 7.5], walls);

	const roof = primitives.polyhedron({
		points: [
			[-10, -10, 15],
			[10, -10, 15],
			[10, 10, 15],
			[-10, 10, 15],
			[0, -10, 25],
			[0, 10, 25]
		],
		faces: [
			[0, 1, 4],
			[1, 2, 5],
			[2, 3, 5],
			[3, 0, 4],
			[4, 5, 2, 1],
			[4, 0, 3, 5]
		]
	});

	const door = cuboid({ size: [5, 1, 8] });
	const movedDoor = translate([0, -10, 4], door);

	const window1 = cuboid({ size: [4, 1, 4] });
	const movedWindow1 = translate([6, -10, 10], window1);

	const window2 = cuboid({ size: [4, 1, 4] });
	const movedWindow2 = translate([-6, -10, 10], window2);

	return subtract(union(movedWalls, roof), movedDoor, movedWindow1, movedWindow2);
}

export function createBolt() {
	const head = cylinder({ radius: 6, height: 4, segments: 6 });
	const movedHead = translate([0, 0, 2], head);

	const shaft = cylinder({ radius: 3, height: 20, segments: 32 });
	const movedShaft = translate([0, 0, -10], shaft);

	return union(movedHead, movedShaft);
}

export const models = {
	cube: { name: 'Cube', fn: createCube },
	sphere: { name: 'Sphere', fn: createSphere },
	cylinder: { name: 'Cylinder', fn: createCylinder },
	complex: { name: 'Complex Shape', fn: createComplexShape },
	gear: { name: 'Gear', fn: createGear },
	house: { name: 'House', fn: createHouse },
	bolt: { name: 'Bolt', fn: createBolt },
	extrusion1010: { name: 'Extrusion 1010', fn: createExtrusion1010 },
	extrusion1515: { name: 'Extrusion 1515 (STL)', fn: createExtrusion1515 },
	extrusion1515Parametric: {
		name: 'Extrusion 1515 (Parametric)',
		fn: createExtrusion1515Parametric
	},
	extrusion2020: { name: 'Extrusion 2020', fn: createExtrusion2020 }
};
