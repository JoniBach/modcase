import type { Sketch, SketchPoint, SketchLine, Constraint, ConstraintSuggestion } from './types';

export class LineTool {
	private startPoint: SketchPoint | null = null;
	private SNAP_DISTANCE = 10;
	private previewLine: { start: SketchPoint; end: { x: number; y: number } } | null = null;

	onClick(x: number, y: number, sketch: Sketch): void {
		let point = this.findNearbyPoint(x, y, sketch);

		if (!point) {
			point = this.createPoint(x, y);
			sketch.points.set(point.id, point);
		}

		if (!this.startPoint) {
			this.startPoint = point;
		} else {
			const line = this.createLine(this.startPoint.id, point.id);
			sketch.lines.set(line.id, line);

			if (this.startPoint !== point && this.distance(this.startPoint, point) < this.SNAP_DISTANCE) {
				this.addCoincidentConstraint(this.startPoint.id, point.id, sketch);
			}

			this.startPoint = point;
		}
	}

	onMouseMove(
		x: number,
		y: number,
		sketch: Sketch
	): { nearbyPoint: SketchPoint | null; preview: any } {
		const nearbyPoint = this.findNearbyPoint(x, y, sketch);

		if (this.startPoint) {
			this.previewLine = {
				start: this.startPoint,
				end: nearbyPoint || { x, y }
			};
		}

		return { nearbyPoint, preview: this.previewLine };
	}

	onEscape(): void {
		this.startPoint = null;
		this.previewLine = null;
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

	private createLine(startPointId: string, endPointId: string): SketchLine {
		return {
			id: this.generateId('line'),
			startPointId,
			endPointId,
			construction: false,
			constraints: []
		};
	}

	private addCoincidentConstraint(point1Id: string, point2Id: string, sketch: Sketch): void {
		const constraint: Constraint = {
			id: this.generateId('constraint'),
			type: 'coincident',
			entities: [point1Id, point2Id],
			satisfied: false
		};
		sketch.constraints.set(constraint.id, constraint);
	}

	private distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}

	private generateId(prefix: string): string {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	getPreviewLine(): { start: SketchPoint; end: { x: number; y: number } } | null {
		return this.previewLine;
	}

	reset(): void {
		this.startPoint = null;
		this.previewLine = null;
	}
}

export class ConstraintSuggester {
	private ANGLE_TOLERANCE = 5;

	onLineCreated(line: SketchLine, sketch: Sketch): ConstraintSuggestion[] {
		const suggestions: ConstraintSuggestion[] = [];
		const start = sketch.points.get(line.startPointId);
		const end = sketch.points.get(line.endPointId);

		if (!start || !end) return suggestions;

		const dx = Math.abs(end.x - start.x);
		const dy = Math.abs(end.y - start.y);

		if (dy < this.ANGLE_TOLERANCE && dx > this.ANGLE_TOLERANCE) {
			suggestions.push({
				constraint: {
					id: this.generateId('constraint'),
					type: 'horizontal',
					entities: [line.id],
					satisfied: false
				},
				position: { x: (start.x + end.x) / 2, y: start.y - 20 },
				icon: '─'
			});
		}

		if (dx < this.ANGLE_TOLERANCE && dy > this.ANGLE_TOLERANCE) {
			suggestions.push({
				constraint: {
					id: this.generateId('constraint'),
					type: 'vertical',
					entities: [line.id],
					satisfied: false
				},
				position: { x: start.x + 20, y: (start.y + end.y) / 2 },
				icon: '│'
			});
		}

		for (const other of sketch.lines.values()) {
			if (other.id === line.id) continue;

			const angle = this.angleBetween(line, other, sketch);

			if (Math.abs(angle) < this.ANGLE_TOLERANCE) {
				suggestions.push({
					constraint: {
						id: this.generateId('constraint'),
						type: 'parallel',
						entities: [line.id, other.id],
						satisfied: false
					},
					position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
					icon: '∥'
				});
			}

			if (
				Math.abs(angle - 90) < this.ANGLE_TOLERANCE ||
				Math.abs(angle + 90) < this.ANGLE_TOLERANCE
			) {
				suggestions.push({
					constraint: {
						id: this.generateId('constraint'),
						type: 'perpendicular',
						entities: [line.id, other.id],
						satisfied: false
					},
					position: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
					icon: '⊥'
				});
			}
		}

		return suggestions;
	}

	private angleBetween(line1: SketchLine, line2: SketchLine, sketch: Sketch): number {
		const start1 = sketch.points.get(line1.startPointId);
		const end1 = sketch.points.get(line1.endPointId);
		const start2 = sketch.points.get(line2.startPointId);
		const end2 = sketch.points.get(line2.endPointId);

		if (!start1 || !end1 || !start2 || !end2) return 0;

		const angle1 = Math.atan2(end1.y - start1.y, end1.x - start1.x);
		const angle2 = Math.atan2(end2.y - start2.y, end2.x - start2.x);

		let diff = ((angle1 - angle2) * 180) / Math.PI;
		while (diff > 180) diff -= 360;
		while (diff < -180) diff += 360;

		return diff;
	}

	private generateId(prefix: string): string {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
