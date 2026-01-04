import pkg from '@jscad/modeling';
import { parseValueWithUnit, type Unit } from './units';

const { primitives } = pkg;
const { rectangle: rect, circle: circ } = primitives;

export const rectangle = (params: {
	width: number | string;
	height: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
}) => {
	const { width, height, x = 0, y = 0, id, unit } = params;

	const widthParsed = parseValueWithUnit(width, unit);
	const heightParsed = parseValueWithUnit(height, unit);
	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	const geom = rect({
		size: [widthParsed.valueInMM, heightParsed.valueInMM],
		center: [xParsed.valueInMM, yParsed.valueInMM]
	});
	return id ? { id, geometry: geom } : geom;
};

export const circle = (params: {
	radius: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
	unit?: Unit;
}) => {
	const { radius, x = 0, y = 0, id, unit } = params;

	const radiusParsed = parseValueWithUnit(radius, unit);
	const xParsed = parseValueWithUnit(x, unit);
	const yParsed = parseValueWithUnit(y, unit);

	const geom = circ({
		radius: radiusParsed.valueInMM,
		center: [xParsed.valueInMM, yParsed.valueInMM]
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
