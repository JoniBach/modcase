import pkg from '@jscad/modeling';

const { primitives } = pkg;
const { rectangle: rect, circle: circ } = primitives;

export const rectangle = (width: number, height: number, x: number = 0, y: number = 0) => {
	return rect({ size: [width, height], center: [x, y] });
};

export const circle = (radius: number, x: number = 0, y: number = 0) => {
	return circ({ radius, center: [x, y] });
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
