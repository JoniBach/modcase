import type { Dimension, Sketch, SketchPoint, SketchLine } from './types';

export class DimensionManager {
	applyDimension(dimension: Dimension, sketch: Sketch): boolean {
		switch (dimension.type) {
			case 'linear':
				return this.applyLinearDimension(dimension, sketch);
			case 'radial':
				return this.applyRadialDimension(dimension, sketch);
			case 'angular':
				return this.applyAngularDimension(dimension, sketch);
			default:
				return false;
		}
	}

	private applyLinearDimension(dimension: Dimension, sketch: Sketch): boolean {
		if (dimension.entities.length !== 2) return false;

		const entity1 =
			sketch.points.get(dimension.entities[0]) || sketch.lines.get(dimension.entities[0]);
		const entity2 =
			sketch.points.get(dimension.entities[1]) || sketch.lines.get(dimension.entities[1]);

		if (!entity1 || !entity2) return false;

		if (this.isPoint(entity1) && this.isPoint(entity2)) {
			return this.applyPointToPointDimension(entity1, entity2, dimension.value);
		}

		if (this.isLine(entity1)) {
			return this.applyLineLengthDimension(entity1, dimension.value, sketch);
		}

		return false;
	}

	private applyPointToPointDimension(
		p1: SketchPoint,
		p2: SketchPoint,
		targetDistance: number
	): boolean {
		const currentDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

		if (Math.abs(currentDist - targetDistance) < 0.01) return false;

		if (currentDist === 0) return false;

		const scale = targetDistance / currentDist;
		const dx = p2.x - p1.x;
		const dy = p2.y - p1.y;

		if (!p1.fixed && !p2.fixed) {
			const midX = (p1.x + p2.x) / 2;
			const midY = (p1.y + p2.y) / 2;
			p1.x = midX - (dx * scale) / 2;
			p1.y = midY - (dy * scale) / 2;
			p2.x = midX + (dx * scale) / 2;
			p2.y = midY + (dy * scale) / 2;
		} else if (!p2.fixed) {
			p2.x = p1.x + dx * scale;
			p2.y = p1.y + dy * scale;
		} else if (!p1.fixed) {
			p1.x = p2.x - dx * scale;
			p1.y = p2.y - dy * scale;
		}

		return true;
	}

	private applyLineLengthDimension(
		line: SketchLine,
		targetLength: number,
		sketch: Sketch
	): boolean {
		const start = sketch.points.get(line.startPointId);
		const end = sketch.points.get(line.endPointId);

		if (!start || !end) return false;

		const currentLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

		if (Math.abs(currentLength - targetLength) < 0.01) return false;

		if (currentLength === 0) return false;

		const scale = targetLength / currentLength;
		const dx = end.x - start.x;
		const dy = end.y - start.y;

		if (!end.fixed) {
			end.x = start.x + dx * scale;
			end.y = start.y + dy * scale;
			return true;
		} else if (!start.fixed) {
			start.x = end.x - dx * scale;
			start.y = end.y - dy * scale;
			return true;
		}

		return false;
	}

	private applyRadialDimension(dimension: Dimension, sketch: Sketch): boolean {
		const circle = sketch.circles.get(dimension.entities[0]);
		if (!circle) return false;

		circle.radius = dimension.value;
		return true;
	}

	private applyAngularDimension(dimension: Dimension, sketch: Sketch): boolean {
		return false;
	}

	private isPoint(entity: SketchPoint | SketchLine): entity is SketchPoint {
		return 'fixed' in entity && !('startPointId' in entity);
	}

	private isLine(entity: SketchPoint | SketchLine): entity is SketchLine {
		return 'startPointId' in entity;
	}

	calculateDistance(
		entity1: SketchPoint | SketchLine,
		entity2: SketchPoint | SketchLine,
		sketch: Sketch
	): number {
		if (this.isPoint(entity1) && this.isPoint(entity2)) {
			return Math.sqrt(Math.pow(entity2.x - entity1.x, 2) + Math.pow(entity2.y - entity1.y, 2));
		}

		if (this.isLine(entity1)) {
			const start = sketch.points.get(entity1.startPointId);
			const end = sketch.points.get(entity1.endPointId);
			if (start && end) {
				return Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
			}
		}

		return 0;
	}
}
