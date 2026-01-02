import type { Sketch, SketchPoint, SketchLine, Constraint } from './types';
import type { Selection } from './SelectTool';

export class ImprovedLineTool {
	private mode: 'select-first' | 'select-second' | 'continuous' = 'select-first';
	private firstPoint: SketchPoint | null = null;
	private lastPoint: SketchPoint | null = null;
	private SNAP_DISTANCE = 10;

	// Create line from two selected points
	createLineFromSelection(selection: Selection, sketch: Sketch): SketchLine | null {
		const selectedPoints = Array.from(selection.points);
		if (selectedPoints.length !== 2) {
			return null;
		}

		const line = this.createLine(selectedPoints[0], selectedPoints[1]);
		sketch.lines.set(line.id, line);
		return line;
	}

	// Click-based line creation (Onshape style)
	onClick(
		x: number,
		y: number,
		sketch: Sketch
	): { line: SketchLine | null; point: SketchPoint | null } {
		// Find or create point at click location
		let point = this.findNearbyPoint(x, y, sketch);

		if (!point) {
			point = this.createPoint(x, y);
			sketch.points.set(point.id, point);
		}

		if (this.mode === 'select-first' || !this.firstPoint) {
			// First point selected
			this.firstPoint = point;
			this.lastPoint = point;
			this.mode = 'select-second';
			return { line: null, point };
		} else {
			// Second point selected - create line
			const line = this.createLine(this.firstPoint.id, point.id);
			sketch.lines.set(line.id, line);

			// Continue from this point for chaining
			this.firstPoint = point;
			this.lastPoint = point;

			return { line, point };
		}
	}

	onMouseMove(
		x: number,
		y: number,
		sketch: Sketch
	): { previewPoint: { x: number; y: number } | null; snapPoint: SketchPoint | null } {
		const snapPoint = this.findNearbyPoint(x, y, sketch);
		const previewPoint = snapPoint || { x, y };

		return { previewPoint, snapPoint };
	}

	reset(): void {
		this.mode = 'select-first';
		this.firstPoint = null;
		this.lastPoint = null;
	}

	cancel(): void {
		this.reset();
	}

	getFirstPoint(): SketchPoint | null {
		return this.firstPoint;
	}

	isWaitingForSecondPoint(): boolean {
		return this.mode === 'select-second' && this.firstPoint !== null;
	}

	private findNearbyPoint(x: number, y: number, sketch: Sketch): SketchPoint | null {
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

	private createLine(startPointId: string, endPointId: string): SketchLine {
		return {
			id: this.generateId('line'),
			startPointId,
			endPointId,
			construction: false,
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
