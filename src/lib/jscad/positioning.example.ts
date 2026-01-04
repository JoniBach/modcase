import {
	resolvePosition,
	resolveAllPositions,
	CircularDependencyError,
	MissingReferenceError,
	type ShapeWithPosition
} from './positioning';

console.log('=== Position Resolution System Examples ===\n');

console.log('Example 1: Simple Relative Positioning');
const example1 = [
	{ shape: 'rectangle', id: 'base', params: { x: '10', y: '20' }, unit: 'mm' as const },
	{
		shape: 'circle',
		id: 'relative',
		params: { x: '5', y: '3' },
		unit: 'mm' as const,
		relativeTo: 'base'
	}
];
const result1 = resolveAllPositions(example1);
console.log('Base position:', result1.get('base'));
console.log('Relative position:', result1.get('relative'));
console.log('Expected: base at (10, 20), relative at (15, 23)\n');

console.log('Example 2: Chained Relative Positioning');
const example2 = [
	{ shape: 'rectangle', id: 'a', params: { x: '10', y: '10' }, unit: 'mm' as const },
	{ shape: 'circle', id: 'b', params: { x: '5', y: '5' }, unit: 'mm' as const, relativeTo: 'a' },
	{ shape: 'rectangle', id: 'c', params: { x: '3', y: '2' }, unit: 'mm' as const, relativeTo: 'b' }
];
const result2 = resolveAllPositions(example2);
console.log('A position:', result2.get('a'));
console.log('B position:', result2.get('b'));
console.log('C position:', result2.get('c'));
console.log('Expected: a at (10, 10), b at (15, 15), c at (18, 17)\n');

console.log('Example 3: Mixed Absolute and Relative');
const example3 = [
	{ shape: 'rectangle', id: 'absolute1', params: { x: '0', y: '0' }, unit: 'mm' as const },
	{
		shape: 'circle',
		id: 'relative1',
		params: { x: '10', y: '10' },
		unit: 'mm' as const,
		relativeTo: 'absolute1'
	},
	{ shape: 'rectangle', id: 'absolute2', params: { x: '-20', y: '-20' }, unit: 'mm' as const }
];
const result3 = resolveAllPositions(example3);
console.log('Absolute1 position:', result3.get('absolute1'));
console.log('Relative1 position:', result3.get('relative1'));
console.log('Absolute2 position:', result3.get('absolute2'));
console.log('Expected: absolute1 at (0, 0), relative1 at (10, 10), absolute2 at (-20, -20)\n');

console.log('Example 4: Circular Dependency Detection');
try {
	const a: ShapeWithPosition = {
		id: 'a',
		params: { x: '10', y: '10' },
		relativeTo: 'b'
	};
	const b: ShapeWithPosition = {
		id: 'b',
		params: { x: '5', y: '5' },
		relativeTo: 'a'
	};
	const shapesMap = new Map([
		['a', a],
		['b', b]
	]);
	resolvePosition(a, shapesMap);
	console.log('ERROR: Should have thrown CircularDependencyError');
} catch (error) {
	if (error instanceof CircularDependencyError) {
		console.log('✓ Circular dependency detected:', error.message);
	} else {
		console.log('ERROR: Wrong error type:', error);
	}
}
console.log();

console.log('Example 5: Missing Reference Detection');
try {
	const shape: ShapeWithPosition = {
		id: 'myShape',
		params: { x: '10', y: '10' },
		relativeTo: 'nonexistent'
	};
	const shapesMap = new Map([['myShape', shape]]);
	resolvePosition(shape, shapesMap);
	console.log('ERROR: Should have thrown MissingReferenceError');
} catch (error) {
	if (error instanceof MissingReferenceError) {
		console.log('✓ Missing reference detected:', error.message);
	} else {
		console.log('ERROR: Wrong error type:', error);
	}
}
console.log();

console.log('=== All Examples Complete ===');
