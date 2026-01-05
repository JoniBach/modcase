import { shapes } from './shapes';
import { tools } from './tools';

export const ioPlate = () => null;
export const basePlate = () => null;
export const sandwichPlate = () => null;
export const motherboardPlate = () => null;
export const casePlate = () => null;
export const example1 = () =>
	tools.union({
		ops: [
			tools.subtract({
				ops: [
					shapes.rectangle({ width: '10', height: '10', x: '0', y: '0', id: 'a' }),
					shapes.circle({ radius: '3', x: '5', y: '5', id: 'b' }),
					shapes.circle({ radius: '2', x: '-1', y: '-1', id: 'c' })
				]
			}),
			shapes.circle({ radius: '1', x: '5', y: '5', id: 'd' })
		]
	});

export const example2 = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				operation: 'subtract',
				ops: [
					{ shape: 'rectangle', params: { width: '10', height: '10', x: '0', y: '0' }, id: 'a' },
					{ shape: 'circle', params: { radius: '3', x: '5', y: '5' }, id: 'b' },
					{ shape: 'circle', params: { radius: '2', x: '-1', y: '-1' }, id: 'c' }
				]
			},
			{ shape: 'circle', params: { radius: '1', x: '5', y: '5' }, id: 'd' }
		]
	});

export const mixedUnits = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '50', height: '30', x: '0', y: '0' },
				id: 'base',
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: '0.5', x: '1', y: '0.5' },
				id: 'hole1',
				unit: 'in'
			},
			{
				shape: 'rectangle',
				params: { width: '2cm', height: '1cm', x: '-15', y: '-10' },
				id: 'feature',
				unit: 'mm'
			}
		]
	});

export const anchorDemo = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'circle',
				params: { radius: '8', x: '0', y: '0' },
				id: 'marker-at-origin',
				unit: 'mm',
				anchor: 'center'
			},
			{
				shape: 'circle',
				params: { radius: '6', x: '0', y: '0' },
				id: 'marker-bottom-left',
				unit: 'mm',
				anchor: 'bottom-left'
			},
			{
				shape: 'circle',
				params: { radius: '10', x: '0', y: '0' },
				id: 'marker-top-right',
				unit: 'mm',
				anchor: 'top-right'
			}
		]
	});

export const anchorPercentage = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '50', height: '30', x: '0', y: '0' },
				id: 'base',
				unit: 'mm',
				anchor: [50, 50]
			},
			{
				shape: 'rectangle',
				params: { width: '20', height: '10', x: '30', y: '0' },
				id: 'custom-percent',
				unit: 'mm',
				anchor: [25, 75]
			},
			{
				shape: 'circle',
				params: { radius: '8', x: '-30', y: '0' },
				id: 'absolute-anchor',
				unit: 'mm',
				anchor: { x: '5mm', y: '5mm' }
			}
		]
	});

export const relativePositioning = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '40', height: '30', x: '0', y: '0' },
				id: 'base',
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: '5', x: '10', y: '5' },
				id: 'circle1',
				unit: 'mm',
				relativeTo: 'base'
			},
			{
				shape: 'circle',
				params: { radius: '3', x: '15', y: '0' },
				id: 'circle2',
				unit: 'mm',
				relativeTo: 'circle1'
			}
		]
	});

export const relativeChain = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '20', height: '20', x: '-30', y: '-30' },
				id: 'rectA',
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: '8', x: '25', y: '0' },
				id: 'circleB',
				unit: 'mm',
				relativeTo: 'rectA'
			},
			{
				shape: 'rectangle',
				params: { width: '15', height: '15', x: '20', y: '0' },
				id: 'rectC',
				unit: 'mm',
				relativeTo: 'circleB'
			},
			{
				shape: 'circle',
				params: { radius: '5', x: '0', y: '20' },
				id: 'circleD',
				unit: 'mm',
				relativeTo: 'rectC'
			}
		]
	});

export const mixedPositioning = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '50', height: '40', x: '0', y: '0' },
				id: 'plate',
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: '4', x: '10', y: '10' },
				id: 'hole1',
				unit: 'mm',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4', x: '-10', y: '10' },
				id: 'hole2',
				unit: 'mm',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4', x: '10', y: '-10' },
				id: 'hole3',
				unit: 'mm',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4', x: '-10', y: '-10' },
				id: 'hole4',
				unit: 'mm',
				relativeTo: 'plate'
			},
			{
				shape: 'rectangle',
				params: { width: '10', height: '10', x: '-40', y: '0' },
				id: 'absolute-feature',
				unit: 'mm'
			}
		]
	});

export const squareWithHoles = () =>
	tools.json({
		operation: 'subtract',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '40', height: '40', x: '0', y: '0' },
				id: 'square',
				anchor: { x: 0, y: 0 },
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: '8', x: 20, y: 20 },
				id: 'center-hole',
				unit: 'mm',
				relativeTo: 'square',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4', x: -15, y: 15 },
				id: 'top-left-hole',
				unit: 'mm',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4', x: 15, y: 15 },
				id: 'top-right-hole',
				unit: 'mm',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4', x: -15, y: -15 },
				id: 'bottom-left-hole',
				unit: 'mm',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4', x: 15, y: -15 },
				id: 'bottom-right-hole',
				unit: 'mm',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			}
		]
	});

export const extrusion2020 = (
	params: {
		outerSlotWidth?: string;
		innerSlotWidth?: string;
		slotHeight?: string;
		slotDepth?: string;
		profileSize?: string;
		centerHoleRadius?: string;
		centerPos?: string;
	} = {}
) => {
	const {
		outerSlotWidth = '11',
		innerSlotWidth = '7.2',
		slotHeight = '1.8',
		slotDepth = '2',
		profileSize = '20',
		centerHoleRadius = '3'
	} = params;
	const centerPos = profileSize / 2;
	return tools.json({
		operation: 'subtract',
		ops: [
			{
				shape: 'rectangle',
				params: { width: profileSize, height: profileSize, x: '0', y: '0' },
				id: 'square',
				anchor: { x: 0, y: 0 },
				unit: 'mm'
			},
			{
				shape: 'circle',
				params: { radius: centerHoleRadius, x: centerPos, y: centerPos },
				id: 'center-hole',
				unit: 'mm',
				relativeTo: 'square',
				anchor: { x: 50, y: 50 }
			},
			// TOP SIDE
			{
				shape: 'rectangle',
				params: { width: innerSlotWidth, height: slotHeight, x: centerPos, y: profileSize },
				id: 'a',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'square'
			},
			{
				shape: 'rectangle',
				params: { width: outerSlotWidth, height: slotHeight, x: '0', y: `-${slotHeight}` },
				id: 'b',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'a'
			},
			{
				shape: 'trapezoidY',
				params: {
					bottomWidth: innerSlotWidth,
					topWidth: outerSlotWidth,
					height: slotDepth,
					x: '0',
					y: `-${slotHeight}`
				},
				id: 'trapezoid-under-b',
				anchor: 'top-center',
				unit: 'mm',
				relativeTo: 'b'
			},
			// BOTTOM SIDE
			{
				shape: 'rectangle',
				params: { width: innerSlotWidth, height: slotHeight, x: centerPos, y: '0' },
				id: 'c',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'square'
			},
			{
				shape: 'rectangle',
				params: { width: outerSlotWidth, height: slotHeight, x: '0', y: slotHeight },
				id: 'd',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'c'
			},
			{
				shape: 'trapezoidY',
				params: {
					bottomWidth: outerSlotWidth,
					topWidth: innerSlotWidth,
					height: slotDepth,
					x: '0',
					y: slotHeight
				},
				id: 'trapezoid-above-d',
				anchor: 'bottom-center',
				unit: 'mm',
				relativeTo: 'd'
			},
			// LEFT SIDE
			{
				shape: 'rectangle',
				params: { width: slotHeight, height: innerSlotWidth, x: '0', y: centerPos },
				id: 'e',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'square'
			},
			{
				shape: 'rectangle',
				params: { width: slotHeight, height: outerSlotWidth, x: slotHeight, y: '0' },
				id: 'f',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'e'
			},
			{
				shape: 'trapezoidX',
				params: {
					width: slotDepth,
					leftHeight: outerSlotWidth,
					rightHeight: innerSlotWidth,
					x: slotHeight,
					y: '0',
					orientation: 'horizontal'
				},
				id: 'g',
				anchor: 'left-center',
				unit: 'mm',
				relativeTo: 'f'
			},
			// RIGHT SIDE
			{
				shape: 'rectangle',
				params: { width: slotHeight, height: innerSlotWidth, x: profileSize, y: centerPos },
				id: 'h',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'square'
			},
			{
				shape: 'rectangle',
				params: { width: slotHeight, height: outerSlotWidth, x: `-${slotHeight}`, y: '0' },
				id: 'i',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'h'
			},
			{
				shape: 'trapezoidX',
				params: {
					width: slotDepth,
					leftHeight: innerSlotWidth,
					rightHeight: outerSlotWidth,
					x: `-${slotHeight}`,
					y: '0',
					orientation: 'horizontal'
				},
				id: 'j',
				anchor: 'right-center',
				unit: 'mm',
				relativeTo: 'i'
			}
		]
	});
};

export const parts = {
	ioPlate,
	basePlate,
	sandwichPlate,
	motherboardPlate,
	casePlate,
	example1,
	example2,
	mixedUnits,
	anchorDemo,
	anchorPercentage,
	relativePositioning,
	relativeChain,
	mixedPositioning,
	extrusion2020,
	squareWithHoles
};

export const partList = [
	{
		id: 'ioPlate',
		name: 'IO Plate'
	},
	{
		id: 'basePlate',
		name: 'Base Plate'
	},
	{
		id: 'sandwichPlate',
		name: 'Sandwich Plate'
	},
	{
		id: 'motherboardPlate',
		name: 'Motherboard Plate'
	},
	{
		id: 'casePlate',
		name: 'Case Plate'
	},
	{
		id: 'example1',
		name: 'Example 1'
	},
	{
		id: 'example2',
		name: 'Example 2'
	},
	{
		id: 'mixedUnits',
		name: 'Mixed Units Demo'
	},
	{
		id: 'anchorDemo',
		name: 'Anchor Presets Demo'
	},
	{
		id: 'anchorPercentage',
		name: 'Anchor Percentage Demo'
	},
	{
		id: 'relativePositioning',
		name: 'Relative Positioning Demo'
	},
	{
		id: 'relativeChain',
		name: 'Relative Chain Demo'
	},
	{
		id: 'mixedPositioning',
		name: 'Mixed Positioning Demo'
	},
	{
		id: 'extrusion2020',
		name: 'Extrusion 2020'
	},
	{
		id: 'squareWithHoles',
		name: '40x40 Square with Holes'
	}
];
