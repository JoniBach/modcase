<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas, Rect, Circle, Polygon, Line, Path, Text } from 'fabric';
	import * as fabric from 'fabric';

	export const onSketchReady: (sketchData: any) => void = () => {};

	let canvasContainer: HTMLDivElement;
	let canvas: Canvas;
	let currentTool: 'select' | 'rect' | 'circle' | 'polygon' | 'path' = 'select';
	let isDrawing = false;
	let currentPath: Path | null = null;
	let polygonPoints: Circle[] = [];
	let polygonLines: Line[] = [];
	let tempPolygonLine: Line | null = null;
	let snapIndicator: Circle | null = null;
	let measurementLabels: any[] = [];
	let tempMeasurementLabel: any = null;
	const SNAP_DISTANCE = 15;
	let shapeLabelsMap = new Map<any, any[]>();

	onMount(() => {
		initCanvas();
		return () => {
			if (canvas) {
				canvas.dispose();
			}
		};
	});

	function initCanvas() {
		const canvasEl = document.getElementById('sketch-canvas') as HTMLCanvasElement;
		if (!canvasEl) {
			console.error('Canvas element not found');
			return;
		}

		canvas = new Canvas(canvasEl, {
			width: 800,
			height: 600,
			backgroundColor: '#f5f5f5',
			selection: true
		});

		canvas.on('mouse:down', handleMouseDown);
		canvas.on('mouse:move', handleMouseMove);
		canvas.on('mouse:up', handleMouseUp);
		canvas.on('selection:created', handleSelection);
		canvas.on('selection:updated', handleSelection);
		canvas.on('selection:cleared', handleSelectionCleared);
		canvas.on('object:moving', handleObjectTransform);
		canvas.on('object:scaling', handleObjectTransform);
		canvas.on('object:rotating', handleObjectTransform);
		canvas.on('object:modified', handleObjectTransform);

		console.log('Canvas initialized:', canvas);
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

		if (currentTool === 'polygon' && polygonPoints.length > 0) {
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
		const rect = new Rect({
			left: pointer.x,
			top: pointer.y,
			width: 100,
			height: 80,
			fill: 'rgba(100, 150, 255, 0.3)',
			stroke: '#4a9eff',
			strokeWidth: 2
		});
		canvas.add(rect);
		canvas.setActiveObject(rect);
		canvas.renderAll();
		console.log('Rect added, objects:', canvas.getObjects().length);

		// Switch to select tool after adding shape
		setTool('select');
	}

	function startDrawingCircle(pointer: { x: number; y: number }) {
		const circle = new Circle({
			left: pointer.x,
			top: pointer.y,
			radius: 50,
			fill: 'rgba(100, 255, 150, 0.3)',
			stroke: '#4aff9e',
			strokeWidth: 2
		});
		canvas.add(circle);
		canvas.setActiveObject(circle);
		canvas.renderAll();

		// Switch to select tool after adding shape
		setTool('select');
	}

	function addPolygonPoint(pointer: { x: number; y: number }) {
		// Check if we should snap to the first point to close the polygon
		if (polygonPoints.length >= 3) {
			const firstPoint = polygonPoints[0];
			const firstX = firstPoint.left! + 3;
			const firstY = firstPoint.top! + 3;
			const distance = Math.sqrt(Math.pow(pointer.x - firstX, 2) + Math.pow(pointer.y - firstY, 2));

			if (distance < SNAP_DISTANCE) {
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

			if (distance < SNAP_DISTANCE) {
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

			if (distance < SNAP_DISTANCE) {
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

	function startDrawingPath(pointer: { x: number; y: number }) {
		isDrawing = true;
		const pathData = `M ${pointer.x} ${pointer.y}`;
		currentPath = new Path(pathData, {
			fill: '',
			stroke: '#9e4aff',
			strokeWidth: 2
		});
		canvas.add(currentPath);
	}

	function finishDrawingPath() {
		isDrawing = false;
		if (currentPath) {
			canvas.setActiveObject(currentPath);
			currentPath = null;
		}
		canvas.renderAll();

		// Switch to select tool after finishing path
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
	</div>

	<div bind:this={canvasContainer} class="canvas-container">
		<canvas id="sketch-canvas"></canvas>
	</div>
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
</style>
