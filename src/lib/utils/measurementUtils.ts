import type { MeasurementUnit, Point } from './types';
import { CONFIG } from './config';

export function convertPixelsToUnit(pixels: number, unit: MeasurementUnit): number {
	return pixels / unit.pixelsPerUnit;
}

export function convertUnitToPixels(value: number, unit: MeasurementUnit): number {
	return value * unit.pixelsPerUnit;
}

export function formatMeasurement(
	pixels: number,
	unit: MeasurementUnit,
	decimals: number = 1
): string {
	const value = convertPixelsToUnit(pixels, unit);
	return `${value.toFixed(decimals)}${unit.abbreviation}`;
}

export function calculateDistance(p1: Point, p2: Point): number {
	return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function calculateMidpoint(p1: Point, p2: Point): Point {
	return {
		x: (p1.x + p2.x) / 2,
		y: (p1.y + p2.y) / 2
	};
}

export function calculateAngle(p1: Point, p2: Point): number {
	const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
	return angle < 0 ? angle + 360 : angle;
}

export function getLabelPosition(
	p1: Point,
	p2: Point,
	offset: number = CONFIG.LABEL_OFFSET
): Point {
	const mid = calculateMidpoint(p1, p2);
	const angle = calculateAngle(p1, p2);
	const perpAngle = (angle + 90) * (Math.PI / 180);

	return {
		x: mid.x + Math.cos(perpAngle) * offset,
		y: mid.y + Math.sin(perpAngle) * offset
	};
}

export function shouldRotateLabel(angle: number): boolean {
	return angle > 90 && angle < 270;
}

export function getLabelRotation(p1: Point, p2: Point): number {
	let angle = calculateAngle(p1, p2);
	if (shouldRotateLabel(angle)) {
		angle = angle - 180;
	}
	return angle;
}
