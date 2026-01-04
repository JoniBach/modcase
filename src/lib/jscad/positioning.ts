import { parseValueWithUnit, type Unit } from './units';

export interface ShapePosition {
	x: number | string;
	y: number | string;
	unit?: Unit;
}

export interface ResolvedPosition {
	x: number;
	y: number;
}

export interface ShapeWithPosition {
	id?: string;
	params: {
		x?: number | string;
		y?: number | string;
		[key: string]: unknown;
	};
	relativeTo?: string;
	unit?: Unit;
}

export class CircularDependencyError extends Error {
	constructor(chain: string[]) {
		super(`Circular dependency detected in relative positioning: ${chain.join(' → ')}`);
		this.name = 'CircularDependencyError';
	}
}

export class MissingReferenceError extends Error {
	constructor(shapeId: string, referenceId: string) {
		super(`Shape "${shapeId}" references non-existent shape "${referenceId}"`);
		this.name = 'MissingReferenceError';
	}
}

export function resolvePosition(
	shape: ShapeWithPosition,
	shapesMap: Map<string, ShapeWithPosition>,
	resolvedCache: Map<string, ResolvedPosition> = new Map(),
	visitedChain: string[] = []
): ResolvedPosition {
	const shapeId = shape.id || 'anonymous';
	const shapeUnit = shape.unit || shape.params.unit;

	if (resolvedCache.has(shapeId)) {
		return resolvedCache.get(shapeId)!;
	}

	if (visitedChain.includes(shapeId)) {
		throw new CircularDependencyError([...visitedChain, shapeId]);
	}

	if (!shape.relativeTo) {
		const xParsed = parseValueWithUnit(shape.params.x ?? 0, shapeUnit as Unit | undefined);
		const yParsed = parseValueWithUnit(shape.params.y ?? 0, shapeUnit as Unit | undefined);
		const absolutePos = {
			x: xParsed.valueInMM,
			y: yParsed.valueInMM
		};
		resolvedCache.set(shapeId, absolutePos);
		return absolutePos;
	}

	const referenceShape = shapesMap.get(shape.relativeTo);
	if (!referenceShape) {
		throw new MissingReferenceError(shapeId, shape.relativeTo);
	}

	const referencePos = resolvePosition(referenceShape, shapesMap, resolvedCache, [
		...visitedChain,
		shapeId
	]);

	const offsetXParsed = parseValueWithUnit(shape.params.x ?? 0, shapeUnit as Unit | undefined);
	const offsetYParsed = parseValueWithUnit(shape.params.y ?? 0, shapeUnit as Unit | undefined);

	const absolutePos = {
		x: referencePos.x + offsetXParsed.valueInMM,
		y: referencePos.y + offsetYParsed.valueInMM
	};

	resolvedCache.set(shapeId, absolutePos);
	return absolutePos;
}

export function buildShapesMap(nodes: unknown[]): Map<string, ShapeWithPosition> {
	const shapesMap = new Map<string, ShapeWithPosition>();

	function collectShapes(node: unknown) {
		if (!node || typeof node !== 'object') return;

		if ('shape' in node && 'id' in node && 'params' in node && node.id) {
			shapesMap.set(node.id as string, node as unknown as ShapeWithPosition);
		}

		if ('ops' in node && Array.isArray(node.ops)) {
			node.ops.forEach(collectShapes);
		}
	}

	nodes.forEach(collectShapes);
	return shapesMap;
}

export function resolveAllPositions(nodes: unknown[]): Map<string, ResolvedPosition> {
	const shapesMap = buildShapesMap(nodes);
	const resolvedCache = new Map<string, ResolvedPosition>();

	shapesMap.forEach((shape, id) => {
		if (!resolvedCache.has(id)) {
			resolvePosition(shape, shapesMap, resolvedCache);
		}
	});

	return resolvedCache;
}
