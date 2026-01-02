// Core parametric sketch types for constraint-based modeling

export interface Point3D {
	x: number;
	y: number;
	z: number;
}

export interface Point2D {
	x: number;
	y: number;
}

// Sketch entities (2D on planes)
export interface SketchPoint {
	id: string;
	x: number;
	y: number;
	fixed: boolean;
	constraints: string[];
}

export interface SketchLine {
	id: string;
	startPointId: string;
	endPointId: string;
	construction: boolean;
	constraints: string[];
}

export interface SketchArc {
	id: string;
	centerPointId: string;
	startPointId: string;
	endPointId: string;
	radius: number;
	constraints: string[];
}

export interface SketchCircle {
	id: string;
	centerPointId: string;
	radius: number;
	constraints: string[];
}

// Constraints between entities
export type ConstraintType =
	| 'coincident'
	| 'horizontal'
	| 'vertical'
	| 'parallel'
	| 'perpendicular'
	| 'tangent'
	| 'equal'
	| 'midpoint';

export interface Constraint {
	id: string;
	type: ConstraintType;
	entities: string[];
	satisfied: boolean;
}

// Parametric dimensions
export type DimensionType = 'linear' | 'angular' | 'radial';

export interface Dimension {
	id: string;
	type: DimensionType;
	entities: string[];
	value: number;
	name?: string;
}

// Sketch plane in 3D space
export interface SketchPlane {
	id: string;
	name: string;
	origin: Point3D;
	normal: Point3D;
	xAxis: Point3D;
	yAxis: Point3D;
}

// Closed region for extrusion
export interface ClosedProfile {
	id: string;
	entityIds: string[];
	isHole: boolean;
	parentProfileId?: string;
}

// Complete sketch
export interface Sketch {
	id: string;
	planeId: string;
	points: Map<string, SketchPoint>;
	lines: Map<string, SketchLine>;
	arcs: Map<string, SketchArc>;
	circles: Map<string, SketchCircle>;
	constraints: Map<string, Constraint>;
	dimensions: Map<string, Dimension>;
	profiles: ClosedProfile[];
}

// 3D features
export type FeatureOperation = 'new' | 'add' | 'remove';
export type ExtrudeDirection = 'normal' | 'reverse';

export interface ExtrudeFeature {
	id: string;
	sketchId: string;
	profileIds: string[];
	distance: number;
	direction: ExtrudeDirection;
	operation: FeatureOperation;
}

export interface SolidBody {
	id: string;
	geometry: any; // THREE.BufferGeometry
	mesh: any; // THREE.Mesh
	visible: boolean;
}

// Complete part
export interface Part {
	planes: Map<string, SketchPlane>;
	sketches: Map<string, Sketch>;
	features: ExtrudeFeature[];
	bodies: SolidBody[];
}

// Tool types
export type SketchTool =
	| 'select'
	| 'point'
	| 'line'
	| 'arc'
	| 'circle'
	| 'dimension'
	| 'trim'
	| 'extend';

// Constraint suggestion
export interface ConstraintSuggestion {
	constraint: Constraint;
	position: Point2D;
	icon: string;
}
