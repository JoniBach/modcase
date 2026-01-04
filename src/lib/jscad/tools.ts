import pkg from '@jscad/modeling';

const { booleans } = pkg;
const { union, subtract: sub, intersect: inter } = booleans;

const _add = (...shapes: unknown[]) => {
	if (shapes.length === 0) return null;
	if (shapes.length === 1) return shapes[0];
	return union(...shapes);
};

const _subtract = (baseShape: unknown, ...shapesToSubtract: unknown[]) => {
	if (!baseShape) return null;
	if (shapesToSubtract.length === 0) return baseShape;
	return sub(baseShape, ...shapesToSubtract);
};

const _intersect = (...shapes: unknown[]) => {
	if (shapes.length === 0) return null;
	if (shapes.length === 1) return shapes[0];
	return inter(...shapes);
};

const _union = (...shapes: unknown[]) => {
	if (shapes.length === 0) return null;
	if (shapes.length === 1) return shapes[0];
	return union(...shapes);
};

export const tools = {
	add: _add,
	subtract: _subtract,
	intersect: _intersect,
	union: _union
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
	},
	{
		id: 'union',
		name: 'Union'
	}
];
