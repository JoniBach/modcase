import { shapes } from './shapes';
import { tools } from './tools';

export const ioPlate = () => null;
export const basePlate = () => null;
export const sandwichPlate = () => null;
export const motherboardPlate = () => null;
export const casePlate = () => null;
export const example1 = () =>
	tools.union(
		tools.subtract(
			shapes.rectangle(10, 10, 0, 0),
			shapes.circle(3, 5, 5),
			shapes.circle(2, -1, -1)
		),
		shapes.circle(1, 5, 5)
	);

export const parts = {
	ioPlate,
	basePlate,
	sandwichPlate,
	motherboardPlate,
	casePlate,
	example1
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
	}
];
