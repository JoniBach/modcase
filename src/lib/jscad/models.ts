import pkg from '@jscad/modeling';
import { createExtrusion1515 } from './extrusion1515';
import {
	createExtrusion2020,
	createExtrusion1515Parametric,
	createExtrusion1010
} from './extrusion2020';

const { primitives, booleans, transforms } = pkg;

const { cube, sphere, cylinder, cuboid } = primitives;
const { union, subtract } = booleans;
const { translate, rotate } = transforms;

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

export function ioPlate() {
	// Define main box config first to avoid self-reference
	const mainBoxConfig = {
		width: 100,
		height: 10,
		depth: 40
	};

	// Calculate hole height based on main box depth
	const holeHeight = mainBoxConfig.depth + 2;

	// Configuration object for all parameters
	const config = {
		mainBox: mainBoxConfig,
		subBox: {
			width: 8,
			height: 5,
			depth: 40
		},
		middleBox: {
			width: 70,
			height: 10,
			depth: 20,
			xOffset: 0,
			yOffset: 0,
			zOffset: -10
		},
		holes: {
			radius: 1,
			height: holeHeight,
			offset: 4
		}
	};

	const mainBoxSize: [number, number, number] = [
		config.mainBox.width,
		config.mainBox.height,
		config.mainBox.depth
	];
	const subBoxSize: [number, number, number] = [
		config.subBox.width,
		config.subBox.height,
		config.subBox.depth
	];
	const middleBoxSize: [number, number, number] = [
		config.middleBox.width,
		config.middleBox.height,
		config.middleBox.depth
	];

	// Calculate positions to anchor sub boxes to main box sides
	const subBoxData = [
		{
			pos: [
				mainBoxSize[0] / 2 - subBoxSize[0] / 2,
				mainBoxSize[1] / 2 - subBoxSize[1] / 2,
				mainBoxSize[2] / 2 - subBoxSize[2] / 2
			] as [number, number, number],
			size: subBoxSize
		},
		{
			pos: [
				-(mainBoxSize[0] / 2 - subBoxSize[0] / 2),
				mainBoxSize[1] / 2 - subBoxSize[1] / 2,
				mainBoxSize[2] / 2 - subBoxSize[2] / 2
			] as [number, number, number],
			size: subBoxSize
		},
		{
			pos: [
				0 + config.middleBox.xOffset,
				-(mainBoxSize[1] / 2 - middleBoxSize[1] / 2) + config.middleBox.yOffset,
				mainBoxSize[2] / 2 - middleBoxSize[2] / 2 + config.middleBox.zOffset
			] as [number, number, number],
			size: middleBoxSize
		}
	];

	const mainBox = cuboid({ size: mainBoxSize });

	const subBoxes = subBoxData.map(({ pos, size }) => {
		const subBox = cuboid({ size });
		return translate(pos, subBox);
	});

	// Create 8 holes, one in each corner of the box, offset inward
	const holePositions: [number, number, number][] = [
		// Top face corners
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			mainBoxSize[1] / 2 - config.holes.offset,
			mainBoxSize[2] / 2 - config.holes.offset
		], // top-right-front
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			mainBoxSize[1] / 2 - config.holes.offset,
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // top-right-back
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			mainBoxSize[1] / 2 - config.holes.offset,
			mainBoxSize[2] / 2 - config.holes.offset
		], // top-left-front
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			mainBoxSize[1] / 2 - config.holes.offset,
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // top-left-back
		// Bottom face corners
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			-(mainBoxSize[1] / 2 - config.holes.offset),
			mainBoxSize[2] / 2 - config.holes.offset
		], // bottom-right-front
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			-(mainBoxSize[1] / 2 - config.holes.offset),
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // bottom-right-back
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			-(mainBoxSize[1] / 2 - config.holes.offset),
			mainBoxSize[2] / 2 - config.holes.offset
		], // bottom-left-front
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			-(mainBoxSize[1] / 2 - config.holes.offset),
			-(mainBoxSize[2] / 2 - config.holes.offset)
		] // bottom-left-back
	];
	const holes = holePositions.map((pos) =>
		translate(
			pos,
			rotate(
				[Math.PI / 2, 0, 0],
				cylinder({ radius: config.holes.radius, height: config.holes.height, segments: 16 })
			)
		)
	);

	return subtract(mainBox, ...subBoxes, ...holes);
}

export function sandwichPlate() {
	// Define main box config first to avoid self-reference
	const mainBoxConfig = {
		width: 100,
		height: 10,
		depth: 40
	};

	// Calculate hole height based on main box depth
	const holeHeight = mainBoxConfig.depth + 2;

	// Configuration object for all parameters
	const config = {
		mainBox: mainBoxConfig,
		subBox: {
			width: 50,
			height: 5,
			depth: 40
		},
		middleBox: {
			width: 70,
			height: 10,
			depth: 20,
			xOffset: 0,
			yOffset: 0,
			zOffset: -10
		},
		holes: {
			radius: 1,
			height: holeHeight,
			offset: 4
		}
	};

	const mainBoxSize: [number, number, number] = [
		config.mainBox.width,
		config.mainBox.height,
		config.mainBox.depth
	];
	const subBoxSize: [number, number, number] = [
		config.subBox.width,
		config.subBox.height,
		config.subBox.depth
	];
	const middleBoxSize: [number, number, number] = [
		config.middleBox.width,
		config.middleBox.height,
		config.middleBox.depth
	];

	// Calculate positions to anchor sub boxes to main box sides
	const subBoxData = [
		{
			pos: [0, mainBoxSize[1] / 2 - subBoxSize[1] / 2, mainBoxSize[2] / 2 - subBoxSize[2] / 2] as [
				number,
				number,
				number
			],
			size: subBoxSize
		},
		{
			pos: [
				0 + config.middleBox.xOffset,
				-(mainBoxSize[1] / 2 - middleBoxSize[1] / 2) + config.middleBox.yOffset,
				mainBoxSize[2] / 2 - middleBoxSize[2] / 2 + config.middleBox.zOffset
			] as [number, number, number],
			size: middleBoxSize
		}
	];

	const mainBox = cuboid({ size: mainBoxSize });

	const subBoxes = subBoxData.map(({ pos, size }) => {
		const subBox = cuboid({ size });
		return translate(pos, subBox);
	});

	// Create 8 holes, one in each corner of the box, offset inward
	const holePositions: [number, number, number][] = [
		// Top face corners
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			mainBoxSize[1] / 2 - config.holes.offset,
			mainBoxSize[2] / 2 - config.holes.offset
		], // top-right-front
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			mainBoxSize[1] / 2 - config.holes.offset,
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // top-right-back
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			mainBoxSize[1] / 2 - config.holes.offset,
			mainBoxSize[2] / 2 - config.holes.offset
		], // top-left-front
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			mainBoxSize[1] / 2 - config.holes.offset,
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // top-left-back
		// Bottom face corners
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			-(mainBoxSize[1] / 2 - config.holes.offset),
			mainBoxSize[2] / 2 - config.holes.offset
		], // bottom-right-front
		[
			mainBoxSize[0] / 2 - config.holes.offset,
			-(mainBoxSize[1] / 2 - config.holes.offset),
			-(mainBoxSize[2] / 2 - config.holes.offset)
		], // bottom-right-back
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			-(mainBoxSize[1] / 2 - config.holes.offset),
			mainBoxSize[2] / 2 - config.holes.offset
		], // bottom-left-front
		[
			-(mainBoxSize[0] / 2 - config.holes.offset),
			-(mainBoxSize[1] / 2 - config.holes.offset),
			-(mainBoxSize[2] / 2 - config.holes.offset)
		] // bottom-left-back
	];
	const holes = holePositions.map((pos) =>
		translate(
			pos,
			rotate(
				[Math.PI / 2, 0, 0],
				cylinder({ radius: config.holes.radius, height: config.holes.height, segments: 16 })
			)
		)
	);

	return subtract(mainBox, ...subBoxes, ...holes);
}

export const models = {
	cube: { name: 'Cube', fn: createCube },
	sphere: { name: 'Sphere', fn: createSphere },
	cylinder: { name: 'Cylinder', fn: createCylinder },
	complex: { name: 'Complex Shape', fn: createComplexShape },
	gear: { name: 'Gear', fn: createGear },
	house: { name: 'House', fn: createHouse },
	bolt: { name: 'Bolt', fn: createBolt },
	ioPlate: { name: 'IO Plate', fn: ioPlate },
	sandwichPlate: { name: 'Sandwich Plate', fn: sandwichPlate },
	extrusion1010: { name: 'Extrusion 1010', fn: createExtrusion1010 },
	extrusion1515: { name: 'Extrusion 1515 (STL)', fn: createExtrusion1515 },
	extrusion1515Parametric: {
		name: 'Extrusion 1515 (Parametric)',
		fn: createExtrusion1515Parametric
	},
	extrusion2020: { name: 'Extrusion 2020', fn: createExtrusion2020 }
};
