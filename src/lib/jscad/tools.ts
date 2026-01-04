import pkg from '@jscad/modeling';

import { z } from 'zod';

import { shapes } from './shapes';

const { booleans } = pkg;
const { union, subtract: sub, intersect: inter } = booleans;

const extractGeometry = (shape: unknown) => {
	if (typeof shape === 'object' && shape !== null && 'geometry' in shape) {
		return (shape as { geometry: unknown }).geometry;
	}
	return shape;
};

const _add = (params: { ops: unknown[] }) => {
	const { ops } = params;
	if (ops.length === 0) return null;
	if (ops.length === 1) return extractGeometry(ops[0]);
	// @ts-expect-error: JSCAD union expects specific geometry types, but we use flexible unknown for shape inputs
	return union(...ops.map(extractGeometry));
};

const _subtract = (params: { ops: unknown[] }) => {
	const { ops } = params;
	if (ops.length === 0) return null;
	const [base, ...others] = ops;
	if (others.length === 0) return extractGeometry(base);
	// @ts-expect-error: JSCAD subtract expects specific geometry types, but we use flexible unknown for shape inputs
	return sub(extractGeometry(base), ...others.map(extractGeometry));
};

const _intersect = (params: { ops: unknown[] }) => {
	const { ops } = params;
	if (ops.length === 0) return null;
	if (ops.length === 1) return extractGeometry(ops[0]);
	// @ts-expect-error: JSCAD intersect expects specific geometry types, but we use flexible unknown for shape inputs
	return inter(...ops.map(extractGeometry));
};

const _union = (params: { ops: unknown[] }) => {
	const { ops } = params;
	if (ops.length === 0) return null;
	if (ops.length === 1) return extractGeometry(ops[0]);
	// @ts-expect-error: JSCAD union expects specific geometry types, but we use flexible unknown for shape inputs
	return union(...ops.map(extractGeometry));
};

const shapeParamsSchema = z.object({
	width: z.union([z.number(), z.string()]).optional(),
	height: z.union([z.number(), z.string()]).optional(),
	radius: z.union([z.number(), z.string()]).optional(),
	x: z.union([z.number(), z.string()]).optional(),
	y: z.union([z.number(), z.string()]).optional()
});

const shapeNodeSchema = z.object({
	shape: z.enum(['rectangle', 'circle', 'polygon', 'path']),
	params: shapeParamsSchema,
	id: z.string().optional()
});

type OperationNode = {
	operation: 'add' | 'subtract' | 'intersect' | 'union';
	ops: (OperationNode | z.infer<typeof shapeNodeSchema>)[];
};

const operationNodeSchema: z.ZodType<OperationNode> = z.lazy(() =>
	z.object({
		operation: z.enum(['add', 'subtract', 'intersect', 'union']),
		ops: z.array(z.union([operationNodeSchema, shapeNodeSchema]))
	})
);

const jsonInputSchema = z.union([operationNodeSchema, shapeNodeSchema]);

function buildGeometry(node: z.infer<typeof jsonInputSchema>): unknown {
	if ('shape' in node) {
		const { shape, params, id } = node;
		if (shape === 'rectangle') {
			return shapes.rectangle({
				width: params.width!,
				height: params.height!,
				x: params.x ?? 0,
				y: params.y ?? 0,
				id
			});
		} else if (shape === 'circle') {
			return shapes.circle({ radius: params.radius!, x: params.x ?? 0, y: params.y ?? 0, id });
		}
		// Add other shapes as needed
		return null;
	} else if ('operation' in node) {
		const { operation, ops } = node;
		const geoms = ops.map(buildGeometry);
		if (operation === 'add' || operation === 'union') {
			return _union({ ops: geoms });
		} else if (operation === 'subtract') {
			const [base, ...others] = geoms;
			return _subtract({ ops: [base, ...others] });
		} else if (operation === 'intersect') {
			return _intersect({ ops: geoms });
		}
	}
	return null;
}

const _jsonTools = (jsonInput: unknown) => {
	const parsed = jsonInputSchema.parse(jsonInput);
	return buildGeometry(parsed);
};

export const tools = {
	add: _add,
	subtract: _subtract,
	intersect: _intersect,
	union: _union,
	json: _jsonTools
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
