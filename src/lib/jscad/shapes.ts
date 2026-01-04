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

export const shapes = {
	rectangle,
	circle
};

export const shapeList = [
	{
		id: 'rectangle',
		name: 'Rectangle'
	},
	{
		id: 'circle',
		name: 'Circle'
	}
];
