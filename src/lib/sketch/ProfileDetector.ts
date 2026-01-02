import type { Sketch, ClosedProfile, SketchLine, SketchPoint } from './types';

export class ProfileDetector {
	detectClosedProfiles(sketch: Sketch): ClosedProfile[] {
		const profiles: ClosedProfile[] = [];
		const visited = new Set<string>();

		for (const line of sketch.lines.values()) {
			if (visited.has(line.id) || line.construction) continue;

			const loop = this.traceLoop(line, sketch, visited);
			if (loop.isClosed && loop.entities.length >= 3) {
				const profile: ClosedProfile = {
					id: this.generateId(),
					entityIds: loop.entities,
					isHole: false
				};
				profiles.push(profile);
				loop.entities.forEach((id) => visited.add(id));
			}
		}

		this.identifyHoles(profiles, sketch);
		return profiles;
	}

	private traceLoop(
		startLine: SketchLine,
		sketch: Sketch,
		visited: Set<string>
	): { isClosed: boolean; entities: string[] } {
		const path: string[] = [startLine.id];
		const visitedInLoop = new Set<string>([startLine.id]);
		let currentPoint = startLine.endPointId;
		let currentLine = startLine;
		const maxSteps = 1000;

		for (let step = 0; step < maxSteps; step++) {
			const nextLine = this.findConnectedLine(currentPoint, currentLine, sketch, visitedInLoop);

			if (!nextLine) {
				return { isClosed: false, entities: [] };
			}

			if (nextLine.id === startLine.id) {
				return { isClosed: true, entities: path };
			}

			path.push(nextLine.id);
			visitedInLoop.add(nextLine.id);
			currentPoint =
				nextLine.startPointId === currentPoint ? nextLine.endPointId : nextLine.startPointId;
			currentLine = nextLine;
		}

		return { isClosed: false, entities: [] };
	}

	private findConnectedLine(
		pointId: string,
		excludeLine: SketchLine,
		sketch: Sketch,
		visited: Set<string>
	): SketchLine | null {
		for (const line of sketch.lines.values()) {
			if (line.id === excludeLine.id || visited.has(line.id) || line.construction) {
				continue;
			}

			if (line.startPointId === pointId || line.endPointId === pointId) {
				return line;
			}
		}
		return null;
	}

	private identifyHoles(profiles: ClosedProfile[], sketch: Sketch): void {
		for (let i = 0; i < profiles.length; i++) {
			for (let j = 0; j < profiles.length; j++) {
				if (i === j) continue;

				if (this.isProfileInsideProfile(profiles[j], profiles[i], sketch)) {
					profiles[j].isHole = true;
					profiles[j].parentProfileId = profiles[i].id;
				}
			}
		}
	}

	private isProfileInsideProfile(
		inner: ClosedProfile,
		outer: ClosedProfile,
		sketch: Sketch
	): boolean {
		const innerPoint = this.getFirstPointOfProfile(inner, sketch);
		if (!innerPoint) return false;

		return this.isPointInProfile(innerPoint, outer, sketch);
	}

	private getFirstPointOfProfile(profile: ClosedProfile, sketch: Sketch): SketchPoint | null {
		if (profile.entityIds.length === 0) return null;

		const firstLine = sketch.lines.get(profile.entityIds[0]);
		if (!firstLine) return null;

		return sketch.points.get(firstLine.startPointId) || null;
	}

	private isPointInProfile(point: SketchPoint, profile: ClosedProfile, sketch: Sketch): boolean {
		const polygon: { x: number; y: number }[] = [];

		for (const entityId of profile.entityIds) {
			const line = sketch.lines.get(entityId);
			if (!line) continue;

			const startPoint = sketch.points.get(line.startPointId);
			if (startPoint) {
				polygon.push({ x: startPoint.x, y: startPoint.y });
			}
		}

		return this.pointInPolygon(point, polygon);
	}

	private pointInPolygon(
		point: { x: number; y: number },
		polygon: { x: number; y: number }[]
	): boolean {
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

	private generateId(): string {
		return `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
