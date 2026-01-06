import pkg from '@jscad/modeling';
import { parseValueWithUnit, type Unit } from './units';
import { parseAnchor, calculateAnchorOffset, type AnchorValue } from './anchors';

const { primitives } = pkg;
const { rectangle: rect, circle: circ } = primitives;

export const rectangle = (params: {
	width: number | string;
	height: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
	anchor?: AnchorValue;
}) => {
	const { width, height, x = 0, y = 0, id, unit, anchor } = params;

	const widthParsed = parseValueWithUnit(width, unit);
	const heightParsed = parseValueWithUnit(height, unit);
	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	const parsedAnchor = parseAnchor(anchor, unit);
	const anchorOffset = calculateAnchorOffset(
		parsedAnchor,
		widthParsed.valueInMM,
		heightParsed.valueInMM
	);

	// JSCAD rect uses center positioning, so we offset from center (50%, 50%)
	const centerOffset = {
		x: widthParsed.valueInMM / 2,
		y: heightParsed.valueInMM / 2
	};

	const geom = rect({
		size: [widthParsed.valueInMM, heightParsed.valueInMM],
		center: [
			xParsed.valueInMM + centerOffset.x - anchorOffset.offsetX,
			yParsed.valueInMM + centerOffset.y - anchorOffset.offsetY
		]
	});
	return id ? { id, geometry: geom } : geom;
};

export const circle = (params: {
	radius: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
	anchor?: AnchorValue;
}) => {
	const { radius, x = 0, y = 0, id, unit, anchor } = params;

	const radiusParsed = parseValueWithUnit(radius, unit);
	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	const diameter = radiusParsed.valueInMM * 2;
	const parsedAnchor = parseAnchor(anchor, unit);
	const anchorOffset = calculateAnchorOffset(parsedAnchor, diameter, diameter);

	// JSCAD circle uses center positioning, so we offset from center (50%, 50%)
	const centerOffset = {
		x: radiusParsed.valueInMM,
		y: radiusParsed.valueInMM
	};

	const geom = circ({
		radius: radiusParsed.valueInMM,
		center: [
			xParsed.valueInMM + centerOffset.x - anchorOffset.offsetX,
			yParsed.valueInMM + centerOffset.y - anchorOffset.offsetY
		]
	});
	return id ? { id, geometry: geom } : geom;
};

export const trapezoidY = (params: {
	// Vertical orientation parameters
	bottomWidth?: number | string;
	topWidth?: number | string;
	height?: number | string;
	// Common parameters
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
	anchor?: AnchorValue;
}) => {
	const { bottomWidth, topWidth, height, x = 0, y = 0, id, unit, anchor } = params;

	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	// Validate required params for vertical orientation
	if (bottomWidth === undefined || topWidth === undefined || height === undefined) {
		throw new Error('Vertical trapezoid requires: bottomWidth, topWidth, and height');
	}

	// Vertical: short edge on top, long edge on bottom
	const bottomParsed = parseValueWithUnit(bottomWidth, unit);
	const topParsed = parseValueWithUnit(topWidth, unit);
	const heightParsed = parseValueWithUnit(height, unit);

	const halfBottom = bottomParsed.valueInMM / 2;
	const halfTop = topParsed.valueInMM / 2;
	const halfHeight = heightParsed.valueInMM / 2;

	const points: [number, number][] = [
		[-halfBottom, -halfHeight], // bottom left
		[halfBottom, -halfHeight], // bottom right
		[halfTop, halfHeight], // top right
		[-halfTop, halfHeight] // top left
	];

	const boundingWidth = bottomParsed.valueInMM;
	const boundingHeight = heightParsed.valueInMM;

	const parsedAnchor = parseAnchor(anchor, unit);
	const anchorOffset = calculateAnchorOffset(parsedAnchor, boundingWidth, boundingHeight);

	const centerOffset = {
		x: boundingWidth / 2,
		y: boundingHeight / 2
	};

	// Transform points to final position
	const transformedPoints: [number, number][] = points.map(([px, py]) => [
		px + xParsed.valueInMM + centerOffset.x - anchorOffset.offsetX,
		py + yParsed.valueInMM + centerOffset.y - anchorOffset.offsetY
	]);

	const geom = pkg.primitives.polygon({ points: transformedPoints });
	return id ? { id, geometry: geom } : geom;
};

export const trapezoidX = (params: {
	// Horizontal orientation parameters
	leftHeight?: number | string;
	rightHeight?: number | string;
	width?: number | string;
	// Common parameters
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
	anchor?: AnchorValue;
}) => {
	const { leftHeight, rightHeight, width, x = 0, y = 0, id, unit, anchor } = params;

	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	// Validate required params for horizontal orientation
	if (width === undefined || leftHeight === undefined || rightHeight === undefined) {
		throw new Error('Horizontal trapezoid requires: width, leftHeight, and rightHeight');
	}

	// Horizontal: short edge on left, long edge on right
	const widthParsed = parseValueWithUnit(width, unit);
	const leftParsed = parseValueWithUnit(leftHeight, unit);
	const rightParsed = parseValueWithUnit(rightHeight, unit);

	const halfWidth = widthParsed.valueInMM / 2;
	const halfLeft = leftParsed.valueInMM / 2;
	const halfRight = rightParsed.valueInMM / 2;

	const points: [number, number][] = [
		[halfWidth, -halfRight], // right bottom
		[halfWidth, halfRight], // right top
		[-halfWidth, halfLeft], // left top
		[-halfWidth, -halfLeft] // left bottom
	];

	const boundingWidth = widthParsed.valueInMM;
	const boundingHeight = Math.max(leftParsed.valueInMM, rightParsed.valueInMM);

	const parsedAnchor = parseAnchor(anchor, unit);
	const anchorOffset = calculateAnchorOffset(parsedAnchor, boundingWidth, boundingHeight);

	const centerOffset = {
		x: boundingWidth / 2,
		y: boundingHeight / 2
	};

	// Transform points to final position
	const transformedPoints: [number, number][] = points.map(([px, py]) => [
		px + xParsed.valueInMM + centerOffset.x - anchorOffset.offsetX,
		py + yParsed.valueInMM + centerOffset.y - anchorOffset.offsetY
	]);

	const geom = pkg.primitives.polygon({ points: transformedPoints });
	return id ? { id, geometry: geom } : geom;
};

export const ref = (params: {
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
	anchor?: AnchorValue;
}) => {
	return circle({ radius: 0, ...params });
};

export const shapes = {
	rectangle,
	circle,
	trapezoidX,
	trapezoidY,
	ref
};

export const shapeList = [
	{
		id: 'rectangle',
		name: 'Rectangle'
	},
	{
		id: 'circle',
		name: 'Circle'
	},
	{
		id: 'trapezoidX',
		name: 'Trapezoid X'
	},
	{
		id: 'trapezoidY',
		name: 'Trapezoid Y'
	},
	{
		id: 'ref',
		name: 'Reference'
	}
];
