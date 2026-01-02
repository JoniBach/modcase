import type { Point } from './types';
import { CONFIG } from './config';

export function snapToGrid(point: Point, gridSpacing: number): Point {
	return {
		x: Math.round(point.x / gridSpacing) * gridSpacing,
		y: Math.round(point.y / gridSpacing) * gridSpacing
	};
}

export function snapAngle(angle: number, snapIncrement: number = CONFIG.ANGLE_SNAP): number {
	return Math.round(angle / snapIncrement) * snapIncrement;
}

export function snapAngleFromPoints(
	p1: Point,
	p2: Point,
	snapIncrement: number = CONFIG.ANGLE_SNAP
): Point {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
	const snappedAngle = snapAngle(currentAngle, snapIncrement) * (Math.PI / 180);

	return {
		x: p1.x + distance * Math.cos(snappedAngle),
		y: p1.y + distance * Math.sin(snappedAngle)
	};
}

export function constrainLength(p1: Point, p2: Point, targetLength: number): Point {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	const currentLength = Math.sqrt(dx * dx + dy * dy);

	if (currentLength === 0) return p2;

	const ratio = targetLength / currentLength;
	return {
		x: p1.x + dx * ratio,
		y: p1.y + dy * ratio
	};
}

export function constrainOrthogonal(p1: Point, p2: Point): Point {
	const dx = Math.abs(p2.x - p1.x);
	const dy = Math.abs(p2.y - p1.y);

	if (dx > dy) {
		return { x: p2.x, y: p1.y };
	} else {
		return { x: p1.x, y: p2.y };
	}
}

export function isNearPoint(
	p1: Point,
	p2: Point,
	threshold: number = CONFIG.SNAP_DISTANCE
): boolean {
	const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	return distance < threshold;
}
