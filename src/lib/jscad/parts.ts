import { pattern } from './pattern';
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
					shapes.rectangle({ width: '10mm', height: '10mm', x: '0mm', y: '0mm', id: 'a' }),
					shapes.circle({ radius: '3mm', x: '5mm', y: '5mm', id: 'b' }),
					shapes.circle({ radius: '2mm', x: '-1mm', y: '-1mm', id: 'c' })
				]
			}),
			shapes.circle({ radius: '1mm', x: '5mm', y: '5mm', id: 'd' })
		]
	});

export const example2 = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				operation: 'subtract',
				ops: [
					{
						shape: 'rectangle',
						params: { width: '10mm', height: '10mm', x: '0mm', y: '0mm' },
						id: 'a'
					},
					{ shape: 'circle', params: { radius: '3mm', x: '5mm', y: '5mm' }, id: 'b' },
					{ shape: 'circle', params: { radius: '2mm', x: '-1mm', y: '-1mm' }, id: 'c' }
				]
			},
			{ shape: 'circle', params: { radius: '1mm', x: '5mm', y: '5mm' }, id: 'd' }
		]
	});

export const mixedUnits = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '50mm', height: '30mm', x: '0mm', y: '0mm' },
				id: 'base'
			},
			{
				shape: 'circle',
				params: { radius: '0.5in', x: '1in', y: '0.5in' },
				id: 'hole1'
			},
			{
				shape: 'rectangle',
				params: { width: '2cm', height: '1cm', x: '-15mm', y: '-10mm' },
				id: 'feature'
			}
		]
	});

export const anchorDemo = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				shape: 'circle',
				params: { radius: '8mm', x: '0mm', y: '0mm' },
				id: 'marker-at-origin',
				anchor: 'center'
			},
			{
				shape: 'circle',
				params: { radius: '6mm', x: '0mm', y: '0mm' },
				id: 'marker-bottom-left',
				anchor: 'bottom-left'
			},
			{
				shape: 'circle',
				params: { radius: '10mm', x: '0mm', y: '0mm' },
				id: 'marker-top-right',
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
				params: { width: '50mm', height: '30mm', x: '0mm', y: '0mm' },
				id: 'base',
				anchor: [50, 50]
			},
			{
				shape: 'rectangle',
				params: { width: '20mm', height: '10mm', x: '30mm', y: '0mm' },
				id: 'custom-percent',
				anchor: [25, 75]
			},
			{
				shape: 'circle',
				params: { radius: '8mm', x: '-30mm', y: '0mm' },
				id: 'absolute-anchor',
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
				params: { width: '40mm', height: '30mm', x: '0mm', y: '0mm' },
				id: 'base'
			},
			{
				shape: 'circle',
				params: { radius: '5mm', x: '10mm', y: '5mm' },
				id: 'circle1',
				relativeTo: 'base'
			},
			{
				shape: 'circle',
				params: { radius: '3mm', x: '15mm', y: '0mm' },
				id: 'circle2',
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
				params: { width: '20mm', height: '20mm', x: '-30mm', y: '-30mm' },
				id: 'rectA'
			},
			{
				shape: 'circle',
				params: { radius: '8mm', x: '25mm', y: '0mm' },
				id: 'circleB',
				relativeTo: 'rectA'
			},
			{
				shape: 'rectangle',
				params: { width: '15mm', height: '15mm', x: '20mm', y: '0mm' },
				id: 'rectC',
				relativeTo: 'circleB'
			},
			{
				shape: 'circle',
				params: { radius: '5mm', x: '0mm', y: '20mm' },
				id: 'circleD',
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
				params: { width: '50mm', height: '40mm', x: '0mm', y: '0mm' },
				id: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '10mm', y: '10mm' },
				id: 'hole1',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '-10mm', y: '10mm' },
				id: 'hole2',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '10mm', y: '-10mm' },
				id: 'hole3',
				relativeTo: 'plate'
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '-10mm', y: '-10mm' },
				id: 'hole4',
				relativeTo: 'plate'
			},
			{
				shape: 'rectangle',
				params: { width: '10mm', height: '10mm', x: '-40mm', y: '0mm' },
				id: 'absolute-feature'
			}
		]
	});

export const squareWithHoles = () =>
	tools.json({
		operation: 'subtract',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '40mm', height: '40mm', x: '0mm', y: '0mm' },
				id: 'square',
				anchor: { x: '0mm', y: '0mm' }
			},
			{
				shape: 'circle',
				params: { radius: '8mm', x: '20mm', y: '20mm' },
				id: 'center-hole',
				relativeTo: 'square',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '-15mm', y: '15mm' },
				id: 'top-left-hole',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '15mm', y: '15mm' },
				id: 'top-right-hole',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '-15mm', y: '-15mm' },
				id: 'bottom-left-hole',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			},
			{
				shape: 'circle',
				params: { radius: '4mm', x: '15mm', y: '-15mm' },
				id: 'bottom-right-hole',
				relativeTo: 'center-hole',
				anchor: { x: 50, y: 50 }
			}
		]
	});

export const extrusion2020 = () => {
	const params = {
		size: '20mm',
		outerSlotWidth: '11mm',
		innerCavityWidth: '7.2mm',
		wallThickness: '1.8mm',
		webDepth: '2mm',
		boreRadius: '3mm'
	};
	return pattern.extrusion(params);
};

export const atxPlate = () =>
	tools.json({
		operation: 'subtract',
		ops: [
			{
				shape: 'rectangle',
				params: { width: '304.8mm', height: '243.84mm', x: '0mm', y: '0mm' },
				id: 'atx',
				anchor: { x: 0, y: 0 }
			},
			// rows
			{
				shape: 'ref',
				params: { x: '0mm', y: '10.16mm' },
				id: 'row-1',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '0mm', y: '33.02mm' },
				id: 'row-2',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '0mm', y: '165.1mm' },
				id: 'row-3',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '0mm', y: '237.49mm' },
				id: 'row-4',
				relativeTo: 'atx',
				anchor: 'center'
			},
			// columns
			{
				shape: 'ref',
				params: { x: '6.35mm', y: '0mm' },
				id: 'col-1',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '163.83mm', y: '0mm' },
				id: 'col-2',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '209.55mm', y: '0mm' },
				id: 'col-3',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '229.87mm', y: '0mm' },
				id: 'col-4',
				relativeTo: 'atx',
				anchor: 'center'
			},
			{
				shape: 'ref',
				params: { x: '288.29mm', y: '0mm' },
				id: 'col-5',
				relativeTo: 'atx',
				anchor: 'center'
			},
			// holes
			{
				shape: 'circle',
				params: { radius: '2mm', x: 'col-2', y: 'row-1' },
				id: 'hole-2-1',
				anchor: 'center'
			},
			{
				shape: 'circle',
				params: { radius: '2mm', x: 'col-3', y: 'row-1' },
				id: 'hole-3-1',
				anchor: 'center'
			},
			{
				shape: 'circle',
				params: { radius: '2mm', x: 'col-5', y: 'row-1' },
				id: 'hole-5-1',
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-1-2',
				params: { radius: '2mm', x: 'col-1', y: 'row-2' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-1-3',
				params: { radius: '2mm', x: 'col-1', y: 'row-3' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-2-3',
				params: { radius: '2mm', x: 'col-2', y: 'row-3' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-3-3',
				params: { radius: '2mm', x: 'col-3', y: 'row-3' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-4-3',
				params: { radius: '2mm', x: 'col-4', y: 'row-3' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-5-3',
				params: { radius: '2mm', x: 'col-5', y: 'row-3' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-1-4',
				params: { radius: '2mm', x: 'col-1', y: 'row-4' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-2-4',
				params: { radius: '2mm', x: 'col-2', y: 'row-4' },
				anchor: 'center'
			},
			{
				shape: 'circle',
				id: 'hole-5-4',
				params: { radius: '2mm', x: 'col-5', y: 'row-4' },
				anchor: 'center'
			}
		]
	});

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
	squareWithHoles,
	atxPlate
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
	},
	{
		id: 'atxPlate',
		name: 'ATX Plate'
	}
];
