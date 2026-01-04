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
					shapes.rectangle({ width: 10, height: 10, x: 0, y: 0, id: 'a' }),
					shapes.circle({ radius: 3, x: 5, y: 5, id: 'b' }),
					shapes.circle({ radius: 2, x: -1, y: -1, id: 'c' })
				]
			}),
			shapes.circle({ radius: 1, x: 5, y: 5, id: 'd' })
		]
	});

export const example2 = () =>
	tools.json({
		operation: 'union',
		ops: [
			{
				operation: 'subtract',
				ops: [
					{ shape: 'rectangle', params: { width: 10, height: 10, x: 0, y: 0 }, id: 'a' },
					{ shape: 'circle', params: { radius: 3, x: 5, y: 5 }, id: 'b' },
					{ shape: 'circle', params: { radius: 2, x: -1, y: -1 }, id: 'c' }
				]
			},
			{ shape: 'circle', params: { radius: 1, x: 5, y: 5 }, id: 'd' }
		]
	});

export const parts = {
	ioPlate,
	basePlate,
	sandwichPlate,
	motherboardPlate,
	casePlate,
	example1,
	example2
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
	}
];
