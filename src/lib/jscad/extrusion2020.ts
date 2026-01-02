import pkg from '@jscad/modeling';

const { primitives, booleans, transforms, hulls } = pkg;
const { cuboid, cylinder } = primitives;
const { subtract } = booleans;
const { translate } = transforms;
const { hull } = hulls;

interface ExtrusionProfile {
	size: number;
	length: number;
	centerHoleDiameter: number;
	slotWidth: number;
	slotDepth: number;
	innerWidth: number;
	trapezoidBaseFromCenter: number;
	cornerRadius: number;
}

const PROFILE_2020: ExtrusionProfile = {
	size: 20,
	length: 20,
	centerHoleDiameter: 4.19,
	slotWidth: 5.26,
	slotDepth: 1.5,
	innerWidth: 11.99,
	trapezoidBaseFromCenter: 6.34,
	cornerRadius: 1.0
};

const PROFILE_1010: ExtrusionProfile = {
	size: 10,
	length: 10,
	centerHoleDiameter: 2,
	slotWidth: 2.56,
	slotDepth: 0.87,
	innerWidth: 5.5,
	trapezoidBaseFromCenter: 3.23,
	cornerRadius: 1.0
};

const PROFILE_1515: ExtrusionProfile = {
	size: 15,
	length: 15,
	centerHoleDiameter: 3.2,
	slotWidth: 3.5,
	slotDepth: 1.18,
	innerWidth: 8.24,
	trapezoidBaseFromCenter: 4.78,
	cornerRadius: 1.0
};

function createRectangularSlot(
	width: number,
	depth: number,
	length: number,
	position: number,
	axis: 'x' | 'y'
): any {
	const slot =
		axis === 'y'
			? cuboid({ size: [width, depth, length] })
			: cuboid({ size: [depth, width, length] });

	return axis === 'y' ? translate([0, position, 0], slot) : translate([position, 0, 0], slot);
}

function createTrapezoidSlot(
	topWidth: number,
	bottomWidth: number,
	length: number,
	outerPosition: number,
	innerPosition: number,
	axis: 'x' | 'y'
): any {
	const thinRect = 0.01;

	if (axis === 'y') {
		const topRect = cuboid({ size: [topWidth, thinRect, length] });
		const bottomRect = cuboid({ size: [bottomWidth, thinRect, length] });
		return hull(
			translate([0, outerPosition, 0], topRect),
			translate([0, innerPosition, 0], bottomRect)
		);
	} else {
		const topRect = cuboid({ size: [thinRect, topWidth, length] });
		const bottomRect = cuboid({ size: [thinRect, bottomWidth, length] });
		return hull(
			translate([outerPosition, 0, 0], topRect),
			translate([innerPosition, 0, 0], bottomRect)
		);
	}
}

function createCornerCutter(cornerRadius: number, extrusionLength: number): any {
	const cube = cuboid({ size: [cornerRadius, cornerRadius, extrusionLength] });
	const cyl = cylinder({ radius: cornerRadius, height: extrusionLength, segments: 32 });
	return subtract(cube, cyl);
}

function createRoundedCorners(size: number, cornerRadius: number, extrusionLength: number): any[] {
	const halfSize = size / 2;
	const cornerPositions = [
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1]
	];

	return cornerPositions.map(([x, y]) =>
		translate(
			[x * (halfSize - cornerRadius), y * (halfSize - cornerRadius), 0],
			createCornerCutter(cornerRadius, extrusionLength)
		)
	);
}

function validateProfile(profile: ExtrusionProfile): void {
	if (profile.slotDepth > profile.size / 2) {
		throw new Error('Slot depth too large for profile size');
	}
	if (profile.cornerRadius * 2 > profile.size) {
		throw new Error('Corner radius too large for profile size');
	}
	if (profile.innerWidth > profile.size) {
		throw new Error('Inner width too large for profile size');
	}
	if (profile.centerHoleDiameter > profile.size) {
		throw new Error('Center hole diameter too large for profile size');
	}
}

function createAluminumExtrusion(profile: ExtrusionProfile): any {
	validateProfile(profile);

	const halfSize = profile.size / 2;
	const extrusionLength = profile.length + 2; // +2 prevents boolean errors on coplanar faces

	const base = cuboid({ size: [profile.size, profile.size, profile.length] });

	const centerHole = translate(
		[0, 0, 0],
		cylinder({
			radius: profile.centerHoleDiameter / 2,
			height: extrusionLength,
			segments: 32
		})
	);

	const outerSlotPos = halfSize - profile.slotDepth / 2;
	const innerChannelPos = halfSize - profile.slotDepth - profile.slotDepth / 2;
	const faceInset = profile.slotDepth + profile.slotDepth;
	const trapOuterPos = halfSize - faceInset;
	const trapInnerPos = halfSize - profile.trapezoidBaseFromCenter;

	const cutouts: any[] = [centerHole];

	const axes: ('x' | 'y')[] = ['x', 'y'];
	const directions = [1, -1];

	axes.forEach((axis) => {
		directions.forEach((dir) => {
			cutouts.push(
				createRectangularSlot(
					profile.slotWidth,
					profile.slotDepth,
					extrusionLength,
					dir * outerSlotPos,
					axis
				)
			);
			cutouts.push(
				createRectangularSlot(
					profile.innerWidth,
					profile.slotDepth,
					extrusionLength,
					dir * innerChannelPos,
					axis
				)
			);
			cutouts.push(
				createTrapezoidSlot(
					profile.innerWidth,
					profile.slotWidth,
					extrusionLength,
					dir * trapOuterPos,
					dir * trapInnerPos,
					axis
				)
			);
		});
	});

	cutouts.push(...createRoundedCorners(profile.size, profile.cornerRadius, extrusionLength));

	return subtract(base, ...cutouts);
}

export function createExtrusion2020() {
	return createAluminumExtrusion(PROFILE_2020);
}

export function createExtrusion1515Parametric() {
	return createAluminumExtrusion(PROFILE_1515);
}

export function createExtrusion1010() {
	return createAluminumExtrusion(PROFILE_1010);
}

export function getProfile2020() {
	return PROFILE_2020;
}

export function getProfile1515() {
	return PROFILE_1515;
}

export function getProfile1010() {
	return PROFILE_1010;
}
