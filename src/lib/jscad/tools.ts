import pkg from '@jscad/modeling';

const { booleans } = pkg;
const { union, subtract: sub, intersect: inter } = booleans;

export const add = (...shapes: unknown[]) => {
	if (shapes.length === 0) return null;
	if (shapes.length === 1) return shapes[0];
	return union(...shapes);
};

export const subtract = (baseShape: unknown, ...shapesToSubtract: unknown[]) => {
	if (!baseShape) return null;
	if (shapesToSubtract.length === 0) return baseShape;
	return sub(baseShape, ...shapesToSubtract);
};

export const intersect = (...shapes: unknown[]) => {
	if (shapes.length === 0) return null;
	if (shapes.length === 1) return shapes[0];
	return inter(...shapes);
};

export const tools = {
	add,
	subtract,
	intersect
};

export const toolList = [
	{
		id: 'add',
		name: 'Add'
	},
	{
		id: 'subtract',
		name: 'Subtract'
	},
	{
		id: 'intersect',
		name: 'Intersect'
	}
];
