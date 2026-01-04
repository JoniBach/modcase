import pkg from '@jscad/modeling';

const { primitives } = pkg;
const { rectangle: rect, circle: circ } = primitives;

export const rectangle = (params: {
	width: number;
	height: number;
	x?: number;
	y?: number;
	id?: string;
}) => {
	const { width, height, x = 0, y = 0, id } = params;
	const geom = rect({ size: [width, height], center: [x, y] });
	return id ? { id, geometry: geom } : geom;
};

export const circle = (params: { radius: number; x?: number; y?: number; id?: string }) => {
	const { radius, x = 0, y = 0, id } = params;
	const geom = circ({ radius, center: [x, y] });
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
