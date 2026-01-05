import pkg from '@jscad/modeling';

import { z } from 'zod';

import { shapes } from './shapes';
import type { Unit } from './units';
import type { AnchorValue } from './anchors';
import { resolveAllPositions, type ResolvedPosition } from './positioning';

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
	// Trapezoid parameters
	bottomWidth: z.union([z.number(), z.string()]).optional(),
	topWidth: z.union([z.number(), z.string()]).optional(),
	leftHeight: z.union([z.number(), z.string()]).optional(),
	rightHeight: z.union([z.number(), z.string()]).optional(),
	orientation: z.enum(['vertical', 'horizontal']).optional(),
	x: z.union([z.number(), z.string()]).optional(),
	y: z.union([z.number(), z.string()]).optional(),
	unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).optional(),
	anchor: z
		.union([
			z.string(),
			z.array(z.union([z.number(), z.string()])),
			z.object({
				x: z.union([z.number(), z.string()]),
				y: z.union([z.number(), z.string()]),
				unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).optional()
			})
		])
		.optional()
});

const shapeNodeSchema = z.object({
	shape: z.enum(['rectangle', 'circle', 'polygon', 'path', 'trapezoidX', 'trapezoidY']),
	params: shapeParamsSchema,
	id: z.string().optional(),
	unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).optional(),
	anchor: z
		.union([
			z.string(),
			z.array(z.union([z.number(), z.string()])),
			z.object({
				x: z.union([z.number(), z.string()]),
				y: z.union([z.number(), z.string()]),
				unit: z.enum(['mm', 'cm', 'm', 'in', 'ft']).optional()
			})
		])
		.optional(),
	relativeTo: z.string().optional()
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

function buildGeometry(
	node: z.infer<typeof jsonInputSchema>,
	resolvedPositions?: Map<string, ResolvedPosition>
): unknown {
	if ('shape' in node) {
		const { shape, params, id, unit, anchor } = node;
		const shapeUnit = unit || params.unit;
		const shapeAnchor = (anchor || params.anchor) as AnchorValue | undefined;

		let xPos = params.x ?? 0;
		let yPos = params.y ?? 0;
		let positionUnit = shapeUnit;

		if (id && resolvedPositions?.has(id)) {
			const resolved = resolvedPositions.get(id)!;
			xPos = resolved.x;
			yPos = resolved.y;
			positionUnit = 'mm'; // Resolved positions are always in MM
		}

		if (shape === 'rectangle') {
			return shapes.rectangle({
				width: params.width!,
				height: params.height!,
				x: xPos,
				y: yPos,
				id,
				unit: positionUnit,
				anchor: shapeAnchor
			});
		} else if (shape === 'circle') {
			return shapes.circle({
				radius: params.radius!,
				x: xPos,
				y: yPos,
				id,
				unit: positionUnit,
				anchor: shapeAnchor
			});
		} else if (shape === 'trapezoidY') {
			return shapes.trapezoidY({
				bottomWidth: params.bottomWidth,
				topWidth: params.topWidth,
				height: params.height,
				x: xPos,
				y: yPos,
				id,
				unit: positionUnit,
				anchor: shapeAnchor
			});
		} else if (shape === 'trapezoidX') {
			return shapes.trapezoidX({
				leftHeight: params.leftHeight,
				rightHeight: params.rightHeight,
				width: params.width,
				x: xPos,
				y: yPos,
				id,
				unit: positionUnit,
				anchor: shapeAnchor
			});
		}
		return null;
	} else if ('operation' in node) {
		const { operation, ops } = node;
		const geoms = ops.map((op) => buildGeometry(op, resolvedPositions));
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

function collectAllNodes(node: z.infer<typeof jsonInputSchema>): unknown[] {
	const nodes: unknown[] = [];

	function collect(n: z.infer<typeof jsonInputSchema>) {
		nodes.push(n);
		if ('operation' in n && n.ops) {
			n.ops.forEach(collect);
		}
	}

	collect(node);
	return nodes;
}

const _jsonTools = (jsonInput: unknown) => {
	const parsed = jsonInputSchema.parse(jsonInput);

	const allNodes = collectAllNodes(parsed);
	const resolvedPositions = resolveAllPositions(allNodes);

	return buildGeometry(parsed, resolvedPositions);
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
