import type { Sketch, SketchPoint, SketchLine } from './types';

export interface Selection {
	points: Set<string>;
	lines: Set<string>;
}

export class SelectTool {
	private selection: Selection = {
		points: new Set(),
		lines: new Set()
	};
	private CLICK_TOLERANCE = 8;

	onClick(x: number, y: number, sketch: Sketch, multiSelect: boolean = false): Selection {
		if (!multiSelect) {
			this.clearSelection();
		}

		// Try to select a point first
		const point = this.findPointAt(x, y, sketch);
		if (point) {
			this.togglePoint(point.id);
			return this.getSelection();
		}

		// Try to select a line
		const line = this.findLineAt(x, y, sketch);
		if (line) {
			this.toggleLine(line.id);
			return this.getSelection();
		}

		// Click on empty space - clear selection if not multi-selecting
		if (!multiSelect) {
			this.clearSelection();
		}

		return this.getSelection();
	}

	onDrag(startX: number, startY: number, endX: number, endY: number, sketch: Sketch): Selection {
		this.clearSelection();

		const minX = Math.min(startX, endX);
		const maxX = Math.max(startX, endX);
		const minY = Math.min(startY, endY);
		const maxY = Math.max(startY, endY);

		// Select all points in rectangle
		for (const point of sketch.points.values()) {
			if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
				this.selection.points.add(point.id);
			}
		}

		// Select all lines with both endpoints in rectangle
		for (const line of sketch.lines.values()) {
			const start = sketch.points.get(line.startPointId);
			const end = sketch.points.get(line.endPointId);
			if (start && end) {
				const startInside =
					start.x >= minX && start.x <= maxX && start.y >= minY && start.y <= maxY;
				const endInside = end.x >= minX && end.x <= maxX && end.y >= minY && end.y <= maxY;
				if (startInside && endInside) {
					this.selection.lines.add(line.id);
				}
			}
		}

		return this.getSelection();
	}

	private findPointAt(x: number, y: number, sketch: Sketch): SketchPoint | null {
		for (const point of sketch.points.values()) {
			const dist = this.distance(point, { x, y });
			if (dist < this.CLICK_TOLERANCE) {
				return point;
			}
		}
		return null;
	}

	private findLineAt(x: number, y: number, sketch: Sketch): SketchLine | null {
		for (const line of sketch.lines.values()) {
			const start = sketch.points.get(line.startPointId);
			const end = sketch.points.get(line.endPointId);
			if (!start || !end) continue;

			const dist = this.distanceToLine(x, y, start, end);
			if (dist < this.CLICK_TOLERANCE) {
				return line;
			}
		}
		return null;
	}

	private distanceToLine(
		x: number,
		y: number,
		start: { x: number; y: number },
		end: { x: number; y: number }
	): number {
		const A = x - start.x;
		const B = y - start.y;
		const C = end.x - start.x;
		const D = end.y - start.y;

		const dot = A * C + B * D;
		const lenSq = C * C + D * D;
		let param = -1;

		if (lenSq !== 0) param = dot / lenSq;

		let xx, yy;

		if (param < 0) {
			xx = start.x;
			yy = start.y;
		} else if (param > 1) {
			xx = end.x;
			yy = end.y;
		} else {
			xx = start.x + param * C;
			yy = start.y + param * D;
		}

		const dx = x - xx;
		const dy = y - yy;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private togglePoint(pointId: string): void {
		if (this.selection.points.has(pointId)) {
			this.selection.points.delete(pointId);
		} else {
			this.selection.points.add(pointId);
		}
	}

	private toggleLine(lineId: string): void {
		if (this.selection.lines.has(lineId)) {
			this.selection.lines.delete(lineId);
		} else {
			this.selection.lines.add(lineId);
		}
	}

	clearSelection(): void {
		this.selection.points.clear();
		this.selection.lines.clear();
	}

	getSelection(): Selection {
		return {
			points: new Set(this.selection.points),
			lines: new Set(this.selection.lines)
		};
	}

	hasSelection(): boolean {
		return this.selection.points.size > 0 || this.selection.lines.size > 0;
	}

	getSelectedPoints(): string[] {
		return Array.from(this.selection.points);
	}

	getSelectedLines(): string[] {
		return Array.from(this.selection.lines);
	}

	private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}
}
