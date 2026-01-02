import type { Point } from './types';

export function calculatePolygonCenter(points: Point[]): Point {
	const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
	return {
		x: sum.x / points.length,
		y: sum.y / points.length
	};
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
	const radians = (angle * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const dx = point.x - center.x;
	const dy = point.y - center.y;

	return {
		x: center.x + dx * cos - dy * sin,
		y: center.y + dx * sin + dy * cos
	};
}

export function scalePoint(point: Point, center: Point, scale: number): Point {
	return {
		x: center.x + (point.x - center.x) * scale,
		y: center.y + (point.y - center.y) * scale
	};
}

export function getBoundingBox(points: Point[]): {
	min: Point;
	max: Point;
	width: number;
	height: number;
} {
	if (points.length === 0) {
		return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 }, width: 0, height: 0 };
	}

	const xs = points.map((p) => p.x);
	const ys = points.map((p) => p.y);
	const min = { x: Math.min(...xs), y: Math.min(...ys) };
	const max = { x: Math.max(...xs), y: Math.max(...ys) };

	return {
		min,
		max,
		width: max.x - min.x,
		height: max.y - min.y
	};
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x,
			yi = polygon[i].y;
		const xj = polygon[j].x,
			yj = polygon[j].y;

		const intersect =
			yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

export function calculatePolygonArea(points: Point[]): number {
	let area = 0;
	for (let i = 0; i < points.length; i++) {
		const j = (i + 1) % points.length;
		area += points[i].x * points[j].y;
		area -= points[j].x * points[i].y;
	}
	return Math.abs(area / 2);
}

export function calculatePolygonPerimeter(points: Point[]): number {
	let perimeter = 0;
	for (let i = 0; i < points.length; i++) {
		const j = (i + 1) % points.length;
		const dx = points[j].x - points[i].x;
		const dy = points[j].y - points[i].y;
		perimeter += Math.sqrt(dx * dx + dy * dy);
	}
	return perimeter;
}
