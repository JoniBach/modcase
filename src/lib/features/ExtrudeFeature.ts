import type {
	Sketch,
	ClosedProfile,
	SketchPlane,
	ExtrudeFeature,
	SolidBody
} from '../sketch/types';

export class ExtrudeCommand {
	execute(
		sketch: Sketch,
		plane: SketchPlane,
		profileIds: string[],
		distance: number,
		THREE: any
	): { feature: ExtrudeFeature; body: SolidBody } {
		const shapes = this.createShapesFromProfiles(sketch, profileIds, THREE);
		const geometry = this.createExtrudeGeometry(shapes, distance, THREE);
		const transformedGeometry = this.transformToWorldSpace(geometry, plane, THREE);
		const mesh = this.createMesh(transformedGeometry, THREE);

		const feature: ExtrudeFeature = {
			id: this.generateId('extrude'),
			sketchId: sketch.id,
			profileIds,
			distance,
			direction: 'normal',
			operation: 'new'
		};

		const body: SolidBody = {
			id: this.generateId('body'),
			geometry: transformedGeometry,
			mesh,
			visible: true
		};

		return { feature, body };
	}

	private createShapesFromProfiles(sketch: Sketch, profileIds: string[], THREE: any): any[] {
		const shapes: any[] = [];

		for (const profileId of profileIds) {
			const profile = sketch.profiles.find((p) => p.id === profileId);
			if (!profile || profile.isHole) continue;

			const points = this.getProfilePoints(profile, sketch);
			if (points.length < 3) continue;

			const shape = new THREE.Shape();
			shape.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				shape.lineTo(points[i].x, points[i].y);
			}
			shape.closePath();

			const holes = sketch.profiles.filter((p) => p.parentProfileId === profileId && p.isHole);
			for (const hole of holes) {
				const holePoints = this.getProfilePoints(hole, sketch);
				if (holePoints.length < 3) continue;

				const holePath = new THREE.Path();
				holePath.moveTo(holePoints[0].x, holePoints[0].y);
				for (let i = 1; i < holePoints.length; i++) {
					holePath.lineTo(holePoints[i].x, holePoints[i].y);
				}
				holePath.closePath();
				shape.holes.push(holePath);
			}

			shapes.push(shape);
		}

		return shapes;
	}

	private getProfilePoints(profile: ClosedProfile, sketch: Sketch): { x: number; y: number }[] {
		const points: { x: number; y: number }[] = [];
		const visitedPoints = new Set<string>();

		for (const entityId of profile.entityIds) {
			const line = sketch.lines.get(entityId);
			if (!line) continue;

			const startPoint = sketch.points.get(line.startPointId);
			if (startPoint && !visitedPoints.has(startPoint.id)) {
				points.push({ x: startPoint.x, y: startPoint.y });
				visitedPoints.add(startPoint.id);
			}
		}

		return points;
	}

	private createExtrudeGeometry(shapes: any[], distance: number, THREE: any): any {
		const extrudeSettings = {
			depth: distance,
			bevelEnabled: false
		};

		return new THREE.ExtrudeGeometry(shapes, extrudeSettings);
	}

	private transformToWorldSpace(geometry: any, plane: SketchPlane, THREE: any): any {
		const matrix = this.getPlaneTransformMatrix(plane, THREE);
		geometry.applyMatrix4(matrix);
		return geometry;
	}

	private getPlaneTransformMatrix(plane: SketchPlane, THREE: any): any {
		const xAxis = new THREE.Vector3(plane.xAxis.x, plane.xAxis.y, plane.xAxis.z);
		const yAxis = new THREE.Vector3(plane.yAxis.x, plane.yAxis.y, plane.yAxis.z);
		const zAxis = new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z);

		const matrix = new THREE.Matrix4();
		matrix.makeBasis(xAxis, yAxis, zAxis);
		matrix.setPosition(plane.origin.x, plane.origin.y, plane.origin.z);

		return matrix;
	}

	private createMesh(geometry: any, THREE: any): any {
		const material = new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			metalness: 0.3,
			roughness: 0.6,
			side: THREE.DoubleSide
		});

		return new THREE.Mesh(geometry, material);
	}

	private generateId(prefix: string): string {
		return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}
