<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Canvas, Rect, Circle, Polygon, Line, Path, Text, FabricObject } from 'fabric';
	import * as fabric from 'fabric';
	import { HistoryManager } from '$lib/utils/historyManager';
	import { CONFIG } from '$lib/utils/config';
	import {
		MEASUREMENT_UNITS,
		type MeasurementUnit,
		type Point,
		type ShapeProperties
	} from '$lib/utils/types';
	import {
		formatMeasurement,
		calculateDistance,
		calculateMidpoint,
		getLabelPosition,
		calculateAngle
	} from '$lib/utils/measurementUtils';
	import {
		snapToGrid,
		snapAngleFromPoints,
		constrainLength,
		constrainOrthogonal,
		isNearPoint
	} from '$lib/utils/snapUtils';

	export const onSketchReady: (sketchData: any) => void = () => {};

	let canvasContainer: HTMLDivElement;
	let canvas: Canvas;
	let currentTool: 'select' | 'rect' | 'circle' | 'polygon' | 'path' = 'select';
	let isDrawing = false;
	let startPoint: Point | null = null;
	let currentShape: any = null;
	let currentPath: Path | null = null;
	let pathPoints: Point[] = [];
	let polygonPoints: Circle[] = [];
	let polygonLines: Line[] = [];
	let tempPolygonLine: Line | null = null;
	let snapIndicator: Circle | null = null;
	let measurementLabels: any[] = [];
	let tempMeasurementLabel: any = null;
	let shapeLabelsMap = new Map<any, any[]>();

	// New state variables
	let historyManager = new HistoryManager();
	let selectedUnit: MeasurementUnit = MEASUREMENT_UNITS[0];
	let customScale = 1;
	let showGrid = false;
	let gridSpacing = CONFIG.GRID_SPACING;
	let snapToGridEnabled = false;
	let showDimensions = true;
	let zoomLevel = 1;
	let selectedObject: any = null;
	let shapeProperties: ShapeProperties | null = null;
	let showPropertiesPanel = true;
	let showHelpOverlay = false;
	let gridPattern: any = null;

	// Keyboard modifiers
	let shiftPressed = false;
	let ctrlPressed = false;
	let altPressed = false;

	// Polygon drawing constraints
	let polygonConstraintLength: number | null = null;

	// Event listener references for cleanup
	let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
	let keyupHandler: ((e: KeyboardEvent) => void) | null = null;
	let mousedownHandler: ((e: any) => void) | null = null;
	let mousemoveHandler: ((e: any) => void) | null = null;
	let mouseupHandler: ((e: any) => void) | null = null;
	let selectionCreatedHandler: ((e: any) => void) | null = null;
	let selectionUpdatedHandler: ((e: any) => void) | null = null;
	let selectionClearedHandler: ((e: any) => void) | null = null;
	let objectMovingHandler: ((e: any) => void) | null = null;
	let objectScalingHandler: ((e: any) => void) | null = null;
	let objectRotatingHandler: ((e: any) => void) | null = null;
	let objectModifiedHandler: ((e: any) => void) | null = null;
	let mouseOverHandler: ((e: any) => void) | null = null;
	let mouseOutHandler: ((e: any) => void) | null = null;

	onMount(() => {
		initCanvas();
		setupKeyboardListeners();
	});

	onDestroy(() => {
		cleanupEventListeners();
		if (canvas) {
			canvas.dispose();
		}
	});

	function initCanvas() {
		const canvasEl = document.getElementById('sketch-canvas') as HTMLCanvasElement;
		if (!canvasEl) {
			console.error('Canvas element not found');
			return;
		}

		canvas = new Canvas(canvasEl, {
			width: CONFIG.CANVAS_WIDTH,
			height: CONFIG.CANVAS_HEIGHT,
			backgroundColor: '#f5f5f5',
			selection: true
		});

		// Store event handlers for cleanup
		mousedownHandler = handleMouseDown;
		mousemoveHandler = handleMouseMove;
		mouseupHandler = handleMouseUp;
		selectionCreatedHandler = handleSelection;
		selectionUpdatedHandler = handleSelection;
		selectionClearedHandler = handleSelectionCleared;
		objectMovingHandler = handleObjectTransform;
		objectScalingHandler = handleObjectTransform;
		objectRotatingHandler = handleObjectTransform;
		objectModifiedHandler = handleObjectModified;
		mouseOverHandler = handleMouseOver;
		mouseOutHandler = handleMouseOut;

		canvas.on('mouse:down', mousedownHandler);
		canvas.on('mouse:move', mousemoveHandler);
		canvas.on('mouse:up', mouseupHandler);
		canvas.on('selection:created', selectionCreatedHandler);
		canvas.on('selection:updated', selectionUpdatedHandler);
		canvas.on('selection:cleared', selectionClearedHandler);
		canvas.on('object:moving', objectMovingHandler);
		canvas.on('object:scaling', objectScalingHandler);
		canvas.on('object:rotating', objectRotatingHandler);
		canvas.on('object:modified', objectModifiedHandler);
		canvas.on('mouse:over', mouseOverHandler);
		canvas.on('mouse:out', mouseOutHandler);

		// Save initial state
		saveCanvasState();
		console.log('Canvas initialized:', canvas);
	}

	function cleanupEventListeners() {
		if (canvas) {
			if (mousedownHandler) canvas.off('mouse:down', mousedownHandler);
			if (mousemoveHandler) canvas.off('mouse:move', mousemoveHandler);
			if (mouseupHandler) canvas.off('mouse:up', mouseupHandler);
			if (selectionCreatedHandler) canvas.off('selection:created', selectionCreatedHandler);
			if (selectionUpdatedHandler) canvas.off('selection:updated', selectionUpdatedHandler);
			if (selectionClearedHandler) canvas.off('selection:cleared', selectionClearedHandler);
			if (objectMovingHandler) canvas.off('object:moving', objectMovingHandler);
			if (objectScalingHandler) canvas.off('object:scaling', objectScalingHandler);
			if (objectRotatingHandler) canvas.off('object:rotating', objectRotatingHandler);
			if (objectModifiedHandler) canvas.off('object:modified', objectModifiedHandler);
			if (mouseOverHandler) canvas.off('mouse:over', mouseOverHandler);
			if (mouseOutHandler) canvas.off('mouse:out', mouseOutHandler);
		}

		if (keydownHandler) window.removeEventListener('keydown', keydownHandler);
		if (keyupHandler) window.removeEventListener('keyup', keyupHandler);
	}

	function setupKeyboardListeners() {
		keydownHandler = handleKeyDown;
		keyupHandler = handleKeyUp;
		window.addEventListener('keydown', keydownHandler);
		window.addEventListener('keyup', keyupHandler);
	}

	function handleKeyDown(e: KeyboardEvent) {
		// Track modifier keys
		shiftPressed = e.shiftKey;
		ctrlPressed = e.ctrlKey || e.metaKey;
		altPressed = e.altKey;

		// Prevent default for shortcuts
		if (ctrlPressed) {
			switch (e.key.toLowerCase()) {
				case 'z':
					e.preventDefault();
					if (e.shiftKey) {
						redo();
					} else {
						undo();
					}
					break;
				case 'y':
					e.preventDefault();
					redo();
					break;
				case 'a':
					e.preventDefault();
					selectAll();
					break;
				case 'd':
					e.preventDefault();
					duplicateSelected();
					break;
			}
		}

		// Non-modifier shortcuts
		switch (e.key) {
			case 'Delete':
				deleteSelected();
				break;
			case 'Escape':
				deselectAll();
				break;
			case 'g':
			case 'G':
				if (!ctrlPressed) toggleGrid();
				break;
			case 's':
			case 'S':
				if (!ctrlPressed) toggleSnapToGrid();
				break;
			case 'd':
			case 'D':
				if (!ctrlPressed) toggleDimensions();
				break;
			case '?':
			case 'F1':
				e.preventDefault();
				toggleHelp();
				break;
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		shiftPressed = e.shiftKey;
		ctrlPressed = e.ctrlKey || e.metaKey;
		altPressed = e.altKey;
	}

	function handleMouseOver(e: any) {
		if (e.target && currentTool === 'select') {
			e.target.set({ shadow: { color: CONFIG.DEFAULT_COLORS.HOVER, blur: 10 } });
			canvas.renderAll();
		}
	}

	function handleMouseOut(e: any) {
		if (e.target && currentTool === 'select') {
			e.target.set({ shadow: null });
			canvas.renderAll();
		}
	}

	function handleMouseDown(event: any) {
		console.log('Mouse down event:', event, 'Current tool:', currentTool);
		if (!canvas) {
			console.log('No canvas');
			return;
		}

		// In Fabric.js v7, pointer coordinates are in scenePoint or absolutePointer
		const pointer = event.absolutePointer || event.scenePoint || event.viewportPoint;
		if (!pointer) {
			console.log('No pointer found in event');
			return;
		}

		console.log('Pointer:', pointer);

		switch (currentTool) {
			case 'rect':
				startDrawingRect(pointer);
				break;
			case 'circle':
				startDrawingCircle(pointer);
				break;
			case 'polygon':
				addPolygonPoint(pointer);
				break;
			case 'path':
				startDrawingPath(pointer);
				break;
			case 'select':
				// Let Fabric.js handle selection
				break;
		}
	}

	function handleMouseMove(event: any) {
		const pointer = event.absolutePointer || event.scenePoint || event.viewportPoint;
		if (!pointer) return;

		if (currentTool === 'path' && isDrawing) {
			continueDrawingPath(pointer);
		} else if (currentTool === 'polygon' && polygonPoints.length > 0) {
			updateTempPolygonLine(pointer);
			updateSnapIndicator(pointer);
		}
	}

	function handleMouseUp(event: any) {
		if (currentTool === 'path' && isDrawing) {
			finishDrawingPath();
		}
	}

	function startDrawingRect(pointer: { x: number; y: number }) {
		console.log('Drawing rect at:', pointer);
		let pos = snapToGridEnabled ? snapToGrid(pointer, gridSpacing) : pointer;

		const width = 100;
		const height = shiftPressed ? 100 : 80;

		const rect = new Rect({
			left: pos.x,
			top: pos.y,
			width: width,
			height: height,
			fill: CONFIG.DEFAULT_COLORS.RECT_FILL,
			stroke: CONFIG.DEFAULT_COLORS.RECT_STROKE,
			strokeWidth: 2
		});
		canvas.add(rect);
		canvas.setActiveObject(rect);
		canvas.renderAll();
		console.log('Rect added, objects:', canvas.getObjects().length);

		saveCanvasState();
		setTool('select');
	}

	function startDrawingCircle(pointer: { x: number; y: number }) {
		let pos = snapToGridEnabled ? snapToGrid(pointer, gridSpacing) : pointer;

		const circle = new Circle({
			left: pos.x,
			top: pos.y,
			radius: 50,
			fill: CONFIG.DEFAULT_COLORS.CIRCLE_FILL,
			stroke: CONFIG.DEFAULT_COLORS.CIRCLE_STROKE,
			strokeWidth: 2
		});
		canvas.add(circle);
		canvas.setActiveObject(circle);
		canvas.renderAll();

		saveCanvasState();
		setTool('select');
	}

	function addPolygonPoint(pointer: { x: number; y: number }) {
		// Check if we should snap to the first point to close the polygon
		if (polygonPoints.length >= 3) {
			const firstPoint = polygonPoints[0];
			const firstX = firstPoint.left! + 3;
			const firstY = firstPoint.top! + 3;
			const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));

			if (distance < CONFIG.SNAP_DISTANCE) {
				// Close the polygon
				finishPolygon();
				return;
			}
		}

		const point = new Circle({
			left: pointer.x - 3,
			top: pointer.y - 3,
			radius: 3,
			fill: '#ff4a4a',
			selectable: false,
			hasBorders: false,
			hasControls: false
		});

		canvas.add(point);
		polygonPoints.push(point);

		if (polygonPoints.length > 1) {
			const prevPoint = polygonPoints[polygonPoints.length - 2];
			const x1 = prevPoint.left! + 3;
			const y1 = prevPoint.top! + 3;
			const x2 = pointer.x;
			const y2 = pointer.y;

			const line = new Line([x1, y1, x2, y2], {
				stroke: '#ff4a4a',
				strokeWidth: 2,
				selectable: false
			});
			canvas.add(line);
			polygonLines.push(line);

			// Add measurement label
			const label = createMeasurementLabel(x1, y1, x2, y2);
			canvas.add(label);
			measurementLabels.push(label);
		}

		canvas.renderAll();
	}

	function updateTempPolygonLine(pointer: { x: number; y: number }) {
		if (tempPolygonLine) {
			canvas.remove(tempPolygonLine);
		}
		if (tempMeasurementLabel) {
			canvas.remove(tempMeasurementLabel);
		}

		const lastPoint = polygonPoints[polygonPoints.length - 1];
		const x1 = lastPoint.left! + 3;
		const y1 = lastPoint.top! + 3;
		let targetX = pointer.x;
		let targetY = pointer.y;

		// Snap to first point if close enough
		if (polygonPoints.length >= 3) {
			const firstPoint = polygonPoints[0];
			const firstX = firstPoint.left! + 3;
			const firstY = firstPoint.top! + 3;
			const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));

			if (distance < CONFIG.SNAP_DISTANCE) {
				targetX = firstX;
				targetY = firstY;
			}
		}

		tempPolygonLine = new Line([x1, y1, targetX, targetY], {
			stroke: '#ff4a4a',
			strokeWidth: 1,
			strokeDashArray: [5, 5],
			selectable: false
		});
		canvas.add(tempPolygonLine);

		// Add temporary measurement label
		tempMeasurementLabel = createMeasurementLabel(x1, y1, targetX, targetY, true);
		canvas.add(tempMeasurementLabel);

		canvas.renderAll();
	}

	function updateSnapIndicator(pointer: { x: number; y: number }) {
		// Remove existing snap indicator
		if (snapIndicator) {
			canvas.remove(snapIndicator);
			snapIndicator = null;
		}

		// Show snap indicator if near first point
		if (polygonPoints.length >= 3) {
			const firstPoint = polygonPoints[0];
			const firstX = firstPoint.left! + 3;
			const firstY = firstPoint.top! + 3;
			const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));

			if (distance < CONFIG.SNAP_DISTANCE) {
				snapIndicator = new Circle({
					left: firstX - 8,
					top: firstY - 8,
					radius: 8,
					fill: 'transparent',
					stroke: '#4aff9e',
					strokeWidth: 2,
					selectable: false,
					hasBorders: false,
					hasControls: false
				});
				canvas.add(snapIndicator);
			}
		}

		canvas.renderAll();
	}

	function finishPolygon() {
		if (polygonPoints.length < 3) {
			alert('A polygon needs at least 3 points');
			return;
		}

		// Get absolute points from the circles
		const absolutePoints = polygonPoints.map((p) => ({
			x: p.left! + 3,
			y: p.top! + 3
		}));

		// Calculate the center of the polygon
		const centerX = absolutePoints.reduce((sum, p) => sum + p.x, 0) / absolutePoints.length;
		const centerY = absolutePoints.reduce((sum, p) => sum + p.y, 0) / absolutePoints.length;

		// Convert points to be relative to the center
		const relativePoints = absolutePoints.map((p) => ({
			x: p.x - centerX,
			y: p.y - centerY
		}));

		const polygon = new Polygon(relativePoints, {
			left: centerX,
			top: centerY,
			fill: 'rgba(255, 100, 100, 0.3)',
			stroke: '#ff4a4a',
			strokeWidth: 2,
			objectCaching: false
		});

		// Add the closing edge label (last point to first point)
		const lastPoint = polygonPoints[polygonPoints.length - 1];
		const firstPoint = polygonPoints[0];
		const x1 = lastPoint.left! + 3;
		const y1 = lastPoint.top! + 3;
		const x2 = firstPoint.left! + 3;
		const y2 = firstPoint.top! + 3;
		const closingLabel = createMeasurementLabel(x1, y1, x2, y2);
		canvas.add(closingLabel);
		measurementLabels.push(closingLabel);

		// Store labels for this polygon (hide them initially)
		const storedLabels = [...measurementLabels];
		storedLabels.forEach((label) => {
			label.set({ visible: false });
		});
		shapeLabelsMap.set(polygon, storedLabels);

		polygonPoints.forEach((p) => canvas.remove(p));
		polygonLines.forEach((l) => canvas.remove(l));
		if (tempPolygonLine) canvas.remove(tempPolygonLine);
		if (tempMeasurementLabel) canvas.remove(tempMeasurementLabel);
		if (snapIndicator) canvas.remove(snapIndicator);

		polygonPoints = [];
		polygonLines = [];
		measurementLabels = [];
		tempPolygonLine = null;
		tempMeasurementLabel = null;
		snapIndicator = null;

		canvas.add(polygon);
		canvas.setActiveObject(polygon);
		canvas.renderAll();

		// Switch to select tool after completing polygon
		setTool('select');
	}

	function setTool(tool: 'select' | 'rect' | 'circle' | 'polygon' | 'path') {
		if (!canvas) return;

		// Clean up polygon drawing state when switching tools
		if (currentTool === 'polygon' && tool !== 'polygon') {
			polygonPoints.forEach((p) => canvas.remove(p));
			polygonLines.forEach((l) => canvas.remove(l));
			measurementLabels.forEach((label) => canvas.remove(label));
			if (tempPolygonLine) canvas.remove(tempPolygonLine);
			if (tempMeasurementLabel) canvas.remove(tempMeasurementLabel);
			if (snapIndicator) canvas.remove(snapIndicator);
			polygonPoints = [];
			polygonLines = [];
			measurementLabels = [];
			tempPolygonLine = null;
			tempMeasurementLabel = null;
			snapIndicator = null;
		}

		currentTool = tool;
		canvas.isDrawingMode = false;

		if (tool === 'select') {
			canvas.selection = true;
		} else {
			canvas.selection = false;
		}

		if (tool === 'path') {
			canvas.isDrawingMode = true;
		}

		canvas.renderAll();
	}

	function clearCanvas() {
		if (!canvas) return;

		canvas.clear();
		canvas.backgroundColor = '#f5f5f5';
		polygonPoints = [];
		polygonLines = [];
		measurementLabels = [];
		tempPolygonLine = null;
		tempMeasurementLabel = null;
		snapIndicator = null;
		canvas.renderAll();
	}

	function deleteSelected() {
		if (!canvas) return;

		const activeObjects = canvas.getActiveObjects();
		if (activeObjects.length > 0) {
			activeObjects.forEach((obj) => canvas.remove(obj));
			canvas.discardActiveObject();
			canvas.renderAll();
		}
	}

	export function getSketchData() {
		if (!canvas) return [];

		const objects = canvas.getObjects();
		const sketchData: any[] = [];

		objects.forEach((obj) => {
			if (obj.type === 'Rect' || obj.type === 'rect') {
				const rect = obj as Rect;
				sketchData.push({
					type: 'rectangle',
					points: getRectanglePoints(rect)
				});
			} else if (obj.type === 'Circle' || obj.type === 'circle') {
				const circle = obj as Circle;
				sketchData.push({
					type: 'circle',
					points: getCirclePoints(circle)
				});
			} else if (obj.type === 'Polygon' || obj.type === 'polygon') {
				const polygon = obj as Polygon;
				sketchData.push({
					type: 'polygon',
					points: getPolygonPoints(polygon)
				});
			} else if (obj.type === 'Path' || obj.type === 'path') {
				const path = obj as Path;
				sketchData.push({
					type: 'path',
					points: getPathPoints(path)
				});
			}
		});

		return sketchData;
	}

	function getRectanglePoints(rect: Rect): [number, number][] {
		const left = rect.left || 0;
		const top = rect.top || 0;
		const width = (rect.width || 0) * (rect.scaleX || 1);
		const height = (rect.height || 0) * (rect.scaleY || 1);

		return [
			[left, top],
			[left + width, top],
			[left + width, top + height],
			[left, top + height]
		];
	}

	function getCirclePoints(circle: Circle): [number, number][] {
		const centerX = (circle.left || 0) + (circle.radius || 0) * (circle.scaleX || 1);
		const centerY = (circle.top || 0) + (circle.radius || 0) * (circle.scaleY || 1);
		const radius = (circle.radius || 0) * (circle.scaleX || 1);

		const points: [number, number][] = [];
		const segments = 32;
		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * 2 * Math.PI;
			points.push([centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]);
		}
		return points;
	}

	function getPolygonPoints(polygon: Polygon): [number, number][] {
		const points = polygon.points || [];
		const left = polygon.left || 0;
		const top = polygon.top || 0;
		const scaleX = polygon.scaleX || 1;
		const scaleY = polygon.scaleY || 1;

		return points.map((p) => [left + p.x * scaleX, top + p.y * scaleY]);
	}

	function getPathPoints(path: Path): [number, number][] {
		const pathData = path.path || [];
		const points: [number, number][] = [];

		pathData.forEach((segment: any) => {
			if (segment[0] === 'M' || segment[0] === 'L') {
				points.push([segment[1], segment[2]]);
			} else if (segment[0] === 'Q') {
				points.push([segment[3], segment[4]]);
			} else if (segment[0] === 'C') {
				points.push([segment[5], segment[6]]);
			}
		});

		return points;
	}

	function createMeasurementLabel(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		isTemp: boolean = false
	) {
		// Calculate distance
		const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		const distanceText = distance.toFixed(1);

		// Calculate midpoint
		const midX = (x1 + x2) / 2;
		const midY = (y1 + y2) / 2;

		const text = new Text(distanceText, {
			left: midX,
			top: midY - 10,
			fontSize: 12,
			fontFamily: 'Arial',
			fill: isTemp ? '#666' : '#333',
			backgroundColor: isTemp ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
			padding: 3,
			selectable: false,
			originX: 'center',
			originY: 'center'
		});

		return text;
	}

	function handleSelection(event: any) {
		const selected = event.selected;
		if (!selected || selected.length === 0) return;

		// Show labels for selected shapes
		selected.forEach((obj: any) => {
			if (shapeLabelsMap.has(obj)) {
				const labels = shapeLabelsMap.get(obj);
				if (labels) {
					labels.forEach((label: any) => {
						label.set({ visible: true });
					});
				}
			} else if (obj.type === 'Polygon' || obj.type === 'polygon') {
				// Create labels for polygons that don't have them yet
				createLabelsForPolygon(obj);
			} else if (obj.type === 'Rect' || obj.type === 'rect') {
				createLabelsForRect(obj);
			} else if (obj.type === 'Circle' || obj.type === 'circle') {
				createLabelsForCircle(obj);
			}
		});

		canvas.renderAll();
	}

	function handleSelectionCleared(event: any) {
		// Hide all labels when selection is cleared
		shapeLabelsMap.forEach((labels) => {
			labels.forEach((label) => {
				label.set({ visible: false });
			});
		});
		canvas.renderAll();
	}

	function handleObjectTransform(event: any) {
		const obj = event.target;
		if (!obj) return;

		// Create labels if they don't exist yet
		if (!shapeLabelsMap.has(obj)) {
			if (obj.type === 'Polygon' || obj.type === 'polygon') {
				createLabelsForPolygon(obj);
			} else if (obj.type === 'Rect' || obj.type === 'rect') {
				createLabelsForRect(obj);
			} else if (obj.type === 'Circle' || obj.type === 'circle') {
				createLabelsForCircle(obj);
			}
			// Make labels visible since object is being transformed
			const labels = shapeLabelsMap.get(obj);
			if (labels) {
				labels.forEach((label: any) => label.set({ visible: true }));
			}
		} else {
			// Update labels for the transformed object
			updateLabelsForShape(obj);
		}

		canvas.renderAll();
	}

	function updateLabelsForShape(obj: any) {
		const labels = shapeLabelsMap.get(obj);
		if (!labels) return;

		// Remove old labels
		labels.forEach((label) => canvas.remove(label));
		shapeLabelsMap.delete(obj);

		// Create new labels with updated positions
		if (obj.type === 'Polygon' || obj.type === 'polygon') {
			createLabelsForPolygon(obj);
		} else if (obj.type === 'Rect' || obj.type === 'rect') {
			createLabelsForRect(obj);
		} else if (obj.type === 'Circle' || obj.type === 'circle') {
			createLabelsForCircle(obj);
		}

		// Make sure new labels are visible if object is selected
		const newLabels = shapeLabelsMap.get(obj);
		if (newLabels && canvas.getActiveObject() === obj) {
			newLabels.forEach((label) => label.set({ visible: true }));
		}
	}

	function createLabelsForPolygon(polygon: any) {
		const points = polygon.points || [];
		const labels: any[] = [];

		// Get the transformation matrix - this includes position, scale, rotation, etc.
		const matrix = polygon.calcTransformMatrix();

		// Include all edges including the closing edge (last point to first point)
		for (let i = 0; i < points.length; i++) {
			const p1 = points[i];
			const p2 = points[(i + 1) % points.length];

			// Transform points using the polygon's transformation matrix
			const transformedP1 = fabric.util.transformPoint({ x: p1.x, y: p1.y }, matrix);
			const transformedP2 = fabric.util.transformPoint({ x: p2.x, y: p2.y }, matrix);

			const label = createMeasurementLabel(
				transformedP1.x,
				transformedP1.y,
				transformedP2.x,
				transformedP2.y
			);
			canvas.add(label);
			labels.push(label);
		}

		shapeLabelsMap.set(polygon, labels);
	}

	function createLabelsForRect(rect: any) {
		const width = rect.width || 0;
		const height = rect.height || 0;

		const labels: any[] = [];

		// Get the transformation matrix
		const matrix = rect.calcTransformMatrix();

		// Define the four corners in local coordinates (relative to object's origin)
		const corners = [
			{ x: -width / 2, y: -height / 2 }, // top-left
			{ x: width / 2, y: -height / 2 }, // top-right
			{ x: width / 2, y: height / 2 }, // bottom-right
			{ x: -width / 2, y: height / 2 } // bottom-left
		];

		// Transform all corners
		const transformedCorners = corners.map((corner) => fabric.util.transformPoint(corner, matrix));

		// Create labels for each edge
		for (let i = 0; i < 4; i++) {
			const p1 = transformedCorners[i];
			const p2 = transformedCorners[(i + 1) % 4];

			const label = createMeasurementLabel(p1.x, p1.y, p2.x, p2.y);
			canvas.add(label);
			labels.push(label);
		}

		shapeLabelsMap.set(rect, labels);
	}

	function createLabelsForCircle(circle: any) {
		const radius = circle.radius || 0;

		// Get the transformation matrix
		const matrix = circle.calcTransformMatrix();

		// Get the center point (origin is at center for circles)
		const center = fabric.util.transformPoint({ x: 0, y: 0 }, matrix);

		// Get the actual radius after scaling
		const scaledRadius = radius * (circle.scaleX || 1);

		const labels: any[] = [];

		// Diameter label
		const diameterText = `Ø ${(scaledRadius * 2).toFixed(1)}`;
		const label = new Text(diameterText, {
			left: center.x,
			top: center.y - scaledRadius - 20,
			fontSize: 12,
			fontFamily: 'Arial',
			fill: '#333',
			backgroundColor: 'rgba(255, 255, 255, 0.9)',
			padding: 3,
			selectable: false,
			originX: 'center',
			originY: 'center',
			visible: true
		});

		canvas.add(label);
		labels.push(label);

		shapeLabelsMap.set(circle, labels);
	}

	// Path drawing functions
	function startDrawingPath(pointer: Point) {
		isDrawing = true;
		pathPoints = [pointer];
		const pathData = `M ${pointer.x} ${pointer.y}`;
		currentPath = new Path(pathData, {
			fill: '',
			stroke: CONFIG.DEFAULT_COLORS.PATH_STROKE,
			strokeWidth: 2
		});
		canvas.add(currentPath);
	}

	function continueDrawingPath(pointer: Point) {
		if (!currentPath || !isDrawing) return;

		pathPoints.push(pointer);

		// Rebuild path from all points
		let pathData = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
		for (let i = 1; i < pathPoints.length; i++) {
			pathData += ` L ${pathPoints[i].x} ${pathPoints[i].y}`;
		}

		currentPath.set({ path: pathData as any });
		canvas.renderAll();
	}

	function finishDrawingPath() {
		isDrawing = false;
		if (currentPath) {
			canvas.setActiveObject(currentPath);
			currentPath = null;
		}
		pathPoints = [];
		canvas.renderAll();
		saveCanvasState();
		setTool('select');
	}

	// History management
	function saveCanvasState() {
		if (!canvas) return;
		const json = JSON.stringify(canvas.toJSON());
		historyManager.saveState(json);
	}

	function undo() {
		if (!canvas) return;
		const state = historyManager.undo();
		if (state) {
			canvas.loadFromJSON(state.canvasJSON, () => {
				canvas.renderAll();
			});
		}
	}

	function redo() {
		if (!canvas) return;
		const state = historyManager.redo();
		if (state) {
			canvas.loadFromJSON(state.canvasJSON, () => {
				canvas.renderAll();
			});
		}
	}

	function handleObjectModified(event: any) {
		saveCanvasState();
		handleObjectTransform(event);
	}

	// Selection functions
	function selectAll() {
		if (!canvas) return;
		const objects = canvas.getObjects().filter((obj) => obj.selectable !== false);
		if (objects.length > 0) {
			canvas.discardActiveObject();
			const sel = new fabric.ActiveSelection(objects, { canvas });
			canvas.setActiveObject(sel);
			canvas.renderAll();
		}
	}

	function deselectAll() {
		if (!canvas) return;
		canvas.discardActiveObject();
		canvas.renderAll();
	}

	function duplicateSelected() {
		if (!canvas) return;
		const activeObject = canvas.getActiveObject();
		if (!activeObject) return;

		// Create duplicate based on object type
		const type = activeObject.type;
		let duplicate: any = null;

		if (type === 'rect' || type === 'Rect') {
			const rect = activeObject as Rect;
			duplicate = new Rect({
				left: (rect.left || 0) + 10,
				top: (rect.top || 0) + 10,
				width: rect.width,
				height: rect.height,
				fill: rect.fill,
				stroke: rect.stroke,
				strokeWidth: rect.strokeWidth
			});
		} else if (type === 'circle' || type === 'Circle') {
			const circle = activeObject as Circle;
			duplicate = new Circle({
				left: (circle.left || 0) + 10,
				top: (circle.top || 0) + 10,
				radius: circle.radius,
				fill: circle.fill,
				stroke: circle.stroke,
				strokeWidth: circle.strokeWidth
			});
		} else if (type === 'polygon' || type === 'Polygon') {
			const polygon = activeObject as Polygon;
			duplicate = new Polygon(polygon.points || [], {
				left: (polygon.left || 0) + 10,
				top: (polygon.top || 0) + 10,
				fill: polygon.fill,
				stroke: polygon.stroke,
				strokeWidth: polygon.strokeWidth
			});
		}

		if (duplicate) {
			canvas.add(duplicate);
			canvas.setActiveObject(duplicate);
			canvas.renderAll();
			saveCanvasState();
		}
	}

	// Grid and snap functions
	function toggleGrid() {
		showGrid = !showGrid;
		updateGridDisplay();
	}

	function toggleSnapToGrid() {
		snapToGridEnabled = !snapToGridEnabled;
	}

	function toggleDimensions() {
		showDimensions = !showDimensions;
		shapeLabelsMap.forEach((labels) => {
			labels.forEach((label) => {
				label.set({ visible: showDimensions && label.visible });
			});
		});
		canvas.renderAll();
	}

	function updateGridDisplay() {
		if (!canvas) return;

		if (showGrid) {
			if (!gridPattern) {
				createGridPattern();
			}
		} else {
			if (gridPattern) {
				canvas.remove(gridPattern);
				gridPattern = null;
			}
		}
		canvas.renderAll();
	}

	function createGridPattern() {
		if (!canvas) return;

		const lines: Line[] = [];
		const width = canvas.width || CONFIG.CANVAS_WIDTH;
		const height = canvas.height || CONFIG.CANVAS_HEIGHT;

		// Vertical lines
		for (let i = 0; i <= width; i += gridSpacing) {
			const line = new Line([i, 0, i, height], {
				stroke: CONFIG.DEFAULT_COLORS.GRID,
				strokeWidth: 1,
				selectable: false,
				evented: false,
				opacity: CONFIG.GRID_OPACITY
			});
			canvas.add(line);
			lines.push(line);
		}

		// Horizontal lines
		for (let i = 0; i <= height; i += gridSpacing) {
			const line = new Line([0, i, width, i], {
				stroke: CONFIG.DEFAULT_COLORS.GRID,
				strokeWidth: 1,
				selectable: false,
				evented: false,
				opacity: CONFIG.GRID_OPACITY
			});
			canvas.add(line);
			lines.push(line);
		}

		// Grid lines are added first, so they're already at the back
	}

	// Zoom functions
	function zoomIn() {
		if (!canvas) return;
		zoomLevel = Math.min(zoomLevel * 1.2, 5);
		canvas.setZoom(zoomLevel);
		canvas.renderAll();
	}

	function zoomOut() {
		if (!canvas) return;
		zoomLevel = Math.max(zoomLevel / 1.2, 0.1);
		canvas.setZoom(zoomLevel);
		canvas.renderAll();
	}

	function fitToScreen() {
		if (!canvas) return;
		zoomLevel = 1;
		canvas.setZoom(1);
		canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
		canvas.renderAll();
	}

	// Help overlay
	function toggleHelp() {
		showHelpOverlay = !showHelpOverlay;
	}

	// Update measurement unit
	function changeUnit(unit: MeasurementUnit) {
		selectedUnit = unit;
		// Refresh all labels with new unit
		shapeLabelsMap.forEach((labels, shape) => {
			updateLabelsForShape(shape);
		});
	}
</script>

<div class="sketch-editor">
	<div class="toolbar">
		<button
			class="tool-button"
			class:active={currentTool === 'select'}
			on:click={() => setTool('select')}
			title="Select Tool"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={currentTool === 'rect'}
			on:click={() => setTool('rect')}
			title="Rectangle Tool"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={currentTool === 'circle'}
			on:click={() => setTool('circle')}
			title="Circle Tool"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={currentTool === 'polygon'}
			on:click={() => setTool('polygon')}
			title="Polygon Tool"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M12 2l9 4.5v11L12 22l-9-4.5v-11L12 2z" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={currentTool === 'path'}
			on:click={() => setTool('path')}
			title="Freeform Path Tool"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M12 19l7-7 3 3-7 7-3-3z" />
				<path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
			</svg>
		</button>
		<div class="toolbar-divider"></div>
		{#if currentTool === 'polygon' && polygonPoints.length >= 3}
			<button class="tool-button finish-polygon" on:click={finishPolygon} title="Finish Polygon">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</button>
		{/if}
		<button class="tool-button delete" on:click={deleteSelected} title="Delete Selected">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<polyline points="3 6 5 6 21 6" />
				<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			</svg>
		</button>
		<button class="tool-button clear" on:click={clearCanvas} title="Clear Canvas">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>

		<div class="toolbar-divider"></div>

		<!-- Undo/Redo -->
		<button
			class="tool-button"
			on:click={undo}
			disabled={!historyManager.canUndo()}
			title="Undo (Ctrl+Z)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M3 7v6h6" />
				<path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
			</svg>
		</button>
		<button
			class="tool-button"
			on:click={redo}
			disabled={!historyManager.canRedo()}
			title="Redo (Ctrl+Y)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 7v6h-6" />
				<path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
			</svg>
		</button>

		<div class="toolbar-divider"></div>

		<!-- Zoom Controls -->
		<button class="tool-button" on:click={zoomOut} title="Zoom Out (-)">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="M21 21l-4.35-4.35" />
				<line x1="8" y1="11" x2="14" y2="11" />
			</svg>
		</button>
		<span class="zoom-level">{Math.round(zoomLevel * 100)}%</span>
		<button class="tool-button" on:click={zoomIn} title="Zoom In (+)">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="M21 21l-4.35-4.35" />
				<line x1="11" y1="8" x2="11" y2="14" />
				<line x1="8" y1="11" x2="14" y2="11" />
			</svg>
		</button>
		<button class="tool-button" on:click={fitToScreen} title="Fit to Screen">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
				/>
			</svg>
		</button>

		<div class="toolbar-divider"></div>

		<!-- Grid & Snap -->
		<button
			class="tool-button"
			class:active={showGrid}
			on:click={toggleGrid}
			title="Toggle Grid (G)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<rect x="3" y="3" width="7" height="7" />
				<rect x="14" y="3" width="7" height="7" />
				<rect x="14" y="14" width="7" height="7" />
				<rect x="3" y="14" width="7" height="7" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={snapToGridEnabled}
			on:click={toggleSnapToGrid}
			title="Snap to Grid (S)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="3" />
				<path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
			</svg>
		</button>
		<button
			class="tool-button"
			class:active={showDimensions}
			on:click={toggleDimensions}
			title="Toggle Dimensions (D)"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M3 3v18h18" />
				<path d="M7 12h10M12 7v10" />
			</svg>
		</button>

		<div class="toolbar-divider"></div>

		<!-- Unit Selector -->
		<select
			class="unit-selector"
			bind:value={selectedUnit}
			on:change={() => changeUnit(selectedUnit)}
		>
			{#each MEASUREMENT_UNITS as unit}
				<option value={unit}>{unit.abbreviation}</option>
			{/each}
		</select>

		<div class="toolbar-divider"></div>

		<!-- Help -->
		<button class="tool-button" on:click={toggleHelp} title="Help (F1)">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
		</button>
	</div>

	<div class="main-content">
		<div bind:this={canvasContainer} class="canvas-container">
			<canvas id="sketch-canvas"></canvas>
		</div>

		<!-- Properties Panel -->
		{#if showPropertiesPanel && selectedObject}
			<div class="properties-panel">
				<div class="panel-header">
					<h3>Properties</h3>
					<button class="close-btn" on:click={() => (showPropertiesPanel = false)}>×</button>
				</div>
				<div class="panel-content">
					<div class="property-group">
						<label>Type</label>
						<span class="property-value">{selectedObject.type}</span>
					</div>
					<!-- Add more property controls here -->
				</div>
			</div>
		{/if}
	</div>

	<!-- Help Overlay -->
	{#if showHelpOverlay}
		<div class="help-overlay" on:click={toggleHelp}>
			<div class="help-content" on:click|stopPropagation>
				<h2>Keyboard Shortcuts</h2>
				<div class="shortcuts-grid">
					<div class="shortcut-item">
						<kbd>Ctrl+Z</kbd>
						<span>Undo</span>
					</div>
					<div class="shortcut-item">
						<kbd>Ctrl+Y</kbd>
						<span>Redo</span>
					</div>
					<div class="shortcut-item">
						<kbd>Ctrl+A</kbd>
						<span>Select All</span>
					</div>
					<div class="shortcut-item">
						<kbd>Ctrl+D</kbd>
						<span>Duplicate</span>
					</div>
					<div class="shortcut-item">
						<kbd>Delete</kbd>
						<span>Delete Selected</span>
					</div>
					<div class="shortcut-item">
						<kbd>Escape</kbd>
						<span>Deselect</span>
					</div>
					<div class="shortcut-item">
						<kbd>G</kbd>
						<span>Toggle Grid</span>
					</div>
					<div class="shortcut-item">
						<kbd>S</kbd>
						<span>Toggle Snap</span>
					</div>
					<div class="shortcut-item">
						<kbd>D</kbd>
						<span>Toggle Dimensions</span>
					</div>
					<div class="shortcut-item">
						<kbd>Shift</kbd>
						<span>Constrain (Square/Circle)</span>
					</div>
					<div class="shortcut-item">
						<kbd>Ctrl</kbd>
						<span>Orthogonal Lines</span>
					</div>
					<div class="shortcut-item">
						<kbd>Alt</kbd>
						<span>Equal Length</span>
					</div>
				</div>
				<button class="close-help-btn" on:click={toggleHelp}>Close</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.sketch-editor {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #2a2a2a;
	}

	.toolbar {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: #1a1a1a;
		border-bottom: 1px solid #333;
		align-items: center;
	}

	.toolbar-divider {
		width: 1px;
		height: 30px;
		background: #444;
		margin: 0 0.5rem;
	}

	.tool-button {
		background: #2a2a2a;
		border: 2px solid #3a3a3a;
		color: #e0e0e0;
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
	}

	.tool-button:hover {
		background: #3a3a3a;
		border-color: #667eea;
	}

	.tool-button.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: #667eea;
		color: white;
	}

	.tool-button.finish-polygon {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		border-color: #10b981;
		color: white;
	}

	.tool-button.finish-polygon:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
	}

	.tool-button.delete {
		background: #3a2a2a;
	}

	.tool-button.delete:hover {
		background: #4a2a2a;
		border-color: #ff4a4a;
	}

	.tool-button.clear {
		background: #3a2a2a;
	}

	.tool-button.clear:hover {
		background: #4a2a2a;
		border-color: #ff9e4a;
	}

	.canvas-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: auto;
		padding: 2rem;
	}

	:global(#sketch-canvas) {
		border: 2px solid #444;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.tool-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tool-button:disabled:hover {
		background: #2a2a2a;
		border-color: #3a3a3a;
	}

	.zoom-level {
		color: #e0e0e0;
		font-size: 0.875rem;
		font-weight: 500;
		min-width: 50px;
		text-align: center;
	}

	.unit-selector {
		background: #2a2a2a;
		border: 2px solid #3a3a3a;
		color: #e0e0e0;
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		outline: none;
	}

	.unit-selector:hover {
		border-color: #667eea;
	}

	.unit-selector:focus {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.main-content {
		flex: 1;
		display: flex;
		position: relative;
		overflow: hidden;
	}

	.properties-panel {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 300px;
		background: rgba(26, 26, 26, 0.95);
		backdrop-filter: blur(10px);
		border-left: 1px solid #333;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
		z-index: 10;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #333;
	}

	.panel-header h3 {
		margin: 0;
		color: #e0e0e0;
		font-size: 1rem;
		font-weight: 600;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: #e0e0e0;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: #3a3a3a;
		color: #fff;
	}

	.panel-content {
		padding: 1rem;
		overflow-y: auto;
		max-height: calc(100% - 60px);
	}

	.property-group {
		margin-bottom: 1rem;
	}

	.property-group label {
		display: block;
		color: #999;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.5rem;
	}

	.property-value {
		display: block;
		color: #e0e0e0;
		font-size: 0.875rem;
		padding: 0.5rem;
		background: #2a2a2a;
		border-radius: 4px;
	}

	.help-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.help-content {
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		border: 2px solid #667eea;
		border-radius: 12px;
		padding: 2rem;
		max-width: 600px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		animation: scaleIn 0.2s ease;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.help-content h2 {
		margin: 0 0 1.5rem 0;
		color: #e0e0e0;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
	}

	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: rgba(42, 42, 42, 0.5);
		border-radius: 6px;
		border: 1px solid #3a3a3a;
		transition: all 0.2s ease;
	}

	.shortcut-item:hover {
		background: rgba(102, 126, 234, 0.1);
		border-color: #667eea;
	}

	.shortcut-item kbd {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: monospace;
		min-width: 60px;
		text-align: center;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.shortcut-item span {
		color: #e0e0e0;
		font-size: 0.875rem;
	}

	.close-help-btn {
		width: 100%;
		padding: 0.75rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 6px;
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
	}

	.close-help-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.close-help-btn:active {
		transform: translateY(0);
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.toolbar {
			flex-wrap: wrap;
			padding: 0.5rem;
		}

		.properties-panel {
			width: 100%;
			max-width: 300px;
		}

		.shortcuts-grid {
			grid-template-columns: 1fr;
		}

		.help-content {
			margin: 1rem;
			padding: 1.5rem;
		}
	}
</style>
