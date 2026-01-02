import type { Sketch, SketchPoint } from './types';

export class PointTool {
	private SNAP_DISTANCE = 10;

	onClick(x: number, y: number, sketch: Sketch): SketchPoint {
		// Check if clicking near existing point
		const existingPoint = this.findNearbyPoint(x, y, sketch);
		if (existingPoint) {
			return existingPoint;
		}

		// Create new point
		const point = this.createPoint(x, y);
		sketch.points.set(point.id, point);
		return point;
	}

	findNearbyPoint(x: number, y: number, sketch: Sketch): SketchPoint | null {
		for (const point of sketch.points.values()) {
			const dist = this.distance(point, { x, y });
			if (dist < this.SNAP_DISTANCE) {
				return point;
			}
		}
		return null;
	}

	private createPoint(x: number, y: number): SketchPoint {
		return {
			id: this.generateId('point'),
			x,
			y,
			fixed: false,
			constraints: []
		};
	}

	private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}

	private generateId(prefix: string): string {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
