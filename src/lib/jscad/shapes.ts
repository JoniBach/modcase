import pkg from '@jscad/modeling';

const { primitives } = pkg;
const { rectangle: rect, circle: circ } = primitives;

export const rectangle = (params: {
	width: number | string;
	height: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
}) => {
	const { width, height, x = 0, y = 0, id } = params;
	const widthNum = typeof width === 'string' ? parseFloat(width) : width;
	const heightNum = typeof height === 'string' ? parseFloat(height) : height;
	const xNum = typeof x === 'string' ? parseFloat(x) : x;
	const yNum = typeof y === 'string' ? parseFloat(y) : y;
	if (isNaN(widthNum) || isNaN(heightNum) || isNaN(xNum) || isNaN(yNum)) {
		throw new Error('Invalid parameters for rectangle');
	}
	const geom = rect({ size: [widthNum, heightNum], center: [xNum, yNum] });
	return id ? { id, geometry: geom } : geom;
};

export const circle = (params: {
	radius: number | string;
	x?: number | string;
	y?: number | string;
	id?: string;
}) => {
	const { radius, x = 0, y = 0, id } = params;
	const radiusNum = typeof radius === 'string' ? parseFloat(radius) : radius;
	const xNum = typeof x === 'string' ? parseFloat(x) : x;
	const yNum = typeof y === 'string' ? parseFloat(y) : y;
	if (isNaN(radiusNum) || isNaN(xNum) || isNaN(yNum)) {
		throw new Error('Invalid parameters for circle');
	}
	const geom = circ({ radius: radiusNum, center: [xNum, yNum] });
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
