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
		let xValue = shape.params.x ?? 0;
		let yValue = shape.params.y ?? 0;

		// Resolve references in params
		if (typeof xValue === 'string' && shapesMap.has(xValue)) {
			const refPos = resolvePosition(
				shapesMap.get(xValue)!,
				shapesMap,
				resolvedCache,
				visitedChain
			);
			xValue = refPos.x;
		}
		if (typeof yValue === 'string' && shapesMap.has(yValue)) {
			const refPos = resolvePosition(
				shapesMap.get(yValue)!,
				shapesMap,
				resolvedCache,
				visitedChain
			);
			yValue = refPos.y;
		}

		const xParsed = parseValueWithUnit(xValue, shapeUnit as Unit | undefined);
		const yParsed = parseValueWithUnit(yValue, shapeUnit as Unit | undefined);
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

	let offsetXValue = shape.params.x ?? 0;
	let offsetYValue = shape.params.y ?? 0;

	// Resolve references in params
	if (typeof offsetXValue === 'string' && shapesMap.has(offsetXValue)) {
		const refPos = resolvePosition(
			shapesMap.get(offsetXValue)!,
			shapesMap,
			resolvedCache,
			visitedChain
		);
		offsetXValue = refPos.x;
	}
	if (typeof offsetYValue === 'string' && shapesMap.has(offsetYValue)) {
		const refPos = resolvePosition(
			shapesMap.get(offsetYValue)!,
			shapesMap,
			resolvedCache,
			visitedChain
		);
		offsetYValue = refPos.y;
	}

	const offsetXParsed = parseValueWithUnit(offsetXValue, shapeUnit as Unit | undefined);
	const offsetYParsed = parseValueWithUnit(offsetYValue, shapeUnit as Unit | undefined);

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
