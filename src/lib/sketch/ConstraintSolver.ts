import type { Constraint, Sketch, SketchPoint, SketchLine } from './types';

export class ConstraintSolver {
	private maxIterations = 100;
	private tolerance = 0.01;

	solve(sketch: Sketch): boolean {
		for (let i = 0; i < this.maxIterations; i++) {
			let changed = false;

			for (const constraint of sketch.constraints.values()) {
				if (this.applyConstraint(constraint, sketch)) {
					changed = true;
				}
			}

			if (!changed) {
				this.markConstraintsSatisfied(sketch);
				return true;
			}
		}

		return false;
	}

	private applyConstraint(constraint: Constraint, sketch: Sketch): boolean {
		switch (constraint.type) {
			case 'coincident':
				return this.applyCoincident(constraint, sketch);
			case 'horizontal':
				return this.applyHorizontal(constraint, sketch);
			case 'vertical':
				return this.applyVertical(constraint, sketch);
			case 'parallel':
				return this.applyParallel(constraint, sketch);
			case 'perpendicular':
				return this.applyPerpendicular(constraint, sketch);
			case 'equal':
				return this.applyEqual(constraint, sketch);
			case 'midpoint':
				return this.applyMidpoint(constraint, sketch);
			default:
				return false;
		}
	}

	private applyCoincident(constraint: Constraint, sketch: Sketch): boolean {
		const [p1Id, p2Id] = constraint.entities;
		const p1 = sketch.points.get(p1Id);
		const p2 = sketch.points.get(p2Id);

		if (!p1 || !p2) return false;

		const dx = Math.abs(p1.x - p2.x);
		const dy = Math.abs(p1.y - p2.y);

		if (dx < this.tolerance && dy < this.tolerance) return false;

		if (p1.fixed && p2.fixed) {
			return false;
		} else if (p1.fixed) {
			p2.x = p1.x;
			p2.y = p1.y;
		} else if (p2.fixed) {
			p1.x = p2.x;
			p1.y = p2.y;
		} else {
			const mx = (p1.x + p2.x) / 2;
			const my = (p1.y + p2.y) / 2;
			p1.x = mx;
			p1.y = my;
			p2.x = mx;
			p2.y = my;
		}

		return true;
	}

	private applyHorizontal(constraint: Constraint, sketch: Sketch): boolean {
		const lineId = constraint.entities[0];
		const line = sketch.lines.get(lineId);
		if (!line) return false;

		const start = sketch.points.get(line.startPointId);
		const end = sketch.points.get(line.endPointId);
		if (!start || !end) return false;

		const dy = Math.abs(start.y - end.y);
		if (dy < this.tolerance) return false;

		const avgY = (start.y + end.y) / 2;

		if (!start.fixed && !end.fixed) {
			start.y = avgY;
			end.y = avgY;
		} else if (!start.fixed) {
			start.y = end.y;
		} else if (!end.fixed) {
			end.y = start.y;
		}

		return true;
	}

	private applyVertical(constraint: Constraint, sketch: Sketch): boolean {
		const lineId = constraint.entities[0];
		const line = sketch.lines.get(lineId);
		if (!line) return false;

		const start = sketch.points.get(line.startPointId);
		const end = sketch.points.get(line.endPointId);
		if (!start || !end) return false;

		const dx = Math.abs(start.x - end.x);
		if (dx < this.tolerance) return false;

		const avgX = (start.x + end.x) / 2;

		if (!start.fixed && !end.fixed) {
			start.x = avgX;
			end.x = avgX;
		} else if (!start.fixed) {
			start.x = end.x;
		} else if (!end.fixed) {
			end.x = start.x;
		}

		return true;
	}

	private applyParallel(constraint: Constraint, sketch: Sketch): boolean {
		const [line1Id, line2Id] = constraint.entities;
		const line1 = sketch.lines.get(line1Id);
		const line2 = sketch.lines.get(line2Id);
		if (!line1 || !line2) return false;

		const start1 = sketch.points.get(line1.startPointId);
		const end1 = sketch.points.get(line1.endPointId);
		const start2 = sketch.points.get(line2.startPointId);
		const end2 = sketch.points.get(line2.endPointId);
		if (!start1 || !end1 || !start2 || !end2) return false;

		const angle1 = Math.atan2(end1.y - start1.y, end1.x - start1.x);
		const angle2 = Math.atan2(end2.y - start2.y, end2.x - start2.x);

		const angleDiff = Math.abs(angle1 - angle2);
		if (angleDiff < this.tolerance) return false;

		const avgAngle = (angle1 + angle2) / 2;
		const len2 = Math.sqrt(Math.pow(end2.x - start2.x, 2) + Math.pow(end2.y - start2.y, 2));

		if (!end2.fixed) {
			end2.x = start2.x + len2 * Math.cos(avgAngle);
			end2.y = start2.y + len2 * Math.sin(avgAngle);
			return true;
		}

		return false;
	}

	private applyPerpendicular(constraint: Constraint, sketch: Sketch): boolean {
		const [line1Id, line2Id] = constraint.entities;
		const line1 = sketch.lines.get(line1Id);
		const line2 = sketch.lines.get(line2Id);
		if (!line1 || !line2) return false;

		const start1 = sketch.points.get(line1.startPointId);
		const end1 = sketch.points.get(line1.endPointId);
		const start2 = sketch.points.get(line2.startPointId);
		const end2 = sketch.points.get(line2.endPointId);
		if (!start1 || !end1 || !start2 || !end2) return false;

		const angle1 = Math.atan2(end1.y - start1.y, end1.x - start1.x);
		const targetAngle = angle1 + Math.PI / 2;

		const len2 = Math.sqrt(Math.pow(end2.x - start2.x, 2) + Math.pow(end2.y - start2.y, 2));

		if (!end2.fixed) {
			end2.x = start2.x + len2 * Math.cos(targetAngle);
			end2.y = start2.y + len2 * Math.sin(targetAngle);
			return true;
		}

		return false;
	}

	private applyEqual(constraint: Constraint, sketch: Sketch): boolean {
		const [line1Id, line2Id] = constraint.entities;
		const line1 = sketch.lines.get(line1Id);
		const line2 = sketch.lines.get(line2Id);
		if (!line1 || !line2) return false;

		const start1 = sketch.points.get(line1.startPointId);
		const end1 = sketch.points.get(line1.endPointId);
		const start2 = sketch.points.get(line2.startPointId);
		const end2 = sketch.points.get(line2.endPointId);
		if (!start1 || !end1 || !start2 || !end2) return false;

		const len1 = Math.sqrt(Math.pow(end1.x - start1.x, 2) + Math.pow(end1.y - start1.y, 2));
		const len2 = Math.sqrt(Math.pow(end2.x - start2.x, 2) + Math.pow(end2.y - start2.y, 2));

		if (Math.abs(len1 - len2) < this.tolerance) return false;

		const avgLen = (len1 + len2) / 2;
		const angle2 = Math.atan2(end2.y - start2.y, end2.x - start2.x);

		if (!end2.fixed) {
			end2.x = start2.x + avgLen * Math.cos(angle2);
			end2.y = start2.y + avgLen * Math.sin(angle2);
			return true;
		}

		return false;
	}

	private applyMidpoint(constraint: Constraint, sketch: Sketch): boolean {
		const [pointId, lineId] = constraint.entities;
		const point = sketch.points.get(pointId);
		const line = sketch.lines.get(lineId);
		if (!point || !line) return false;

		const start = sketch.points.get(line.startPointId);
		const end = sketch.points.get(line.endPointId);
		if (!start || !end) return false;

		const midX = (start.x + end.x) / 2;
		const midY = (start.y + end.y) / 2;

		if (Math.abs(point.x - midX) < this.tolerance && Math.abs(point.y - midY) < this.tolerance) {
			return false;
		}

		if (!point.fixed) {
			point.x = midX;
			point.y = midY;
			return true;
		}

		return false;
	}

	private markConstraintsSatisfied(sketch: Sketch): void {
		for (const constraint of sketch.constraints.values()) {
			constraint.satisfied = true;
		}
	}
}
