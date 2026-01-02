export interface ShapeData {
	type: 'rectangle' | 'circle' | 'polygon' | 'path';
	points: [number, number][];
	properties?: {
		width?: number;
		height?: number;
		radius?: number;
		fill?: string;
		stroke?: string;
		strokeWidth?: number;
		rotation?: number;
		x?: number;
		y?: number;
	};
}

export interface MeasurementUnit {
	name: string;
	abbreviation: string;
	pixelsPerUnit: number;
}

export interface HistoryState {
	canvasJSON: string;
	timestamp: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface ShapeProperties {
	type: string;
	x: number;
	y: number;
	width?: number;
	height?: number;
	radius?: number;
	rotation: number;
	fill: string;
	stroke: string;
	strokeWidth: number;
	opacity: number;
	lockAspectRatio?: boolean;
}

export const MEASUREMENT_UNITS: MeasurementUnit[] = [
	{ name: 'Pixels', abbreviation: 'px', pixelsPerUnit: 1 },
	{ name: 'Millimeters', abbreviation: 'mm', pixelsPerUnit: 3.7795275591 },
	{ name: 'Centimeters', abbreviation: 'cm', pixelsPerUnit: 37.795275591 },
	{ name: 'Inches', abbreviation: 'in', pixelsPerUnit: 96 }
];
