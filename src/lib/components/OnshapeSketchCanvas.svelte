<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as fabric from 'fabric';
	import type { Sketch, SketchTool, SketchPlane, Constraint } from '../sketch/types';
	import { PointTool } from '../sketch/PointTool';
	import { SelectTool, type Selection } from '../sketch/SelectTool';
	import { ImprovedLineTool } from '../sketch/ImprovedLineTool';
	import { ConstraintSolver } from '../sketch/ConstraintSolver';
	import { ProfileDetector } from '../sketch/ProfileDetector';

	export let sketch: Sketch;
	export let plane: SketchPlane;
	export let onExitSketch: () => void;

	let canvasElement: HTMLCanvasElement;
	let canvas: fabric.Canvas;
	let currentTool: SketchTool = 'select';

	let pointTool = new PointTool();
	let selectTool = new SelectTool();
	let lineTool = new ImprovedLineTool();
	let constraintSolver = new ConstraintSolver();
	let profileDetector = new ProfileDetector();

	let selection: Selection = { points: new Set(), lines: new Set() };
	let isDragging = false;
	let dragStart: { x: number; y: number } | null = null;
	let hoverPoint: any = null;

	onMount(() => {
		canvas = new fabric.Canvas(canvasElement, {
			width: 1000,
			height: 700,
			backgroundColor: '#ffffff',
			selection: false
		});

		console.log('Canvas initialized:', canvas);
		console.log('Current tool:', currentTool);

		renderSketch();
		setupEventListeners();

		// Test: Add a visible circle to confirm canvas is working
		const testCircle = new fabric.Circle({
			left: 50,
			top: 50,
			radius: 10,
			fill: 'red',
			selectable: false
		});
		canvas.add(testCircle);
		canvas.renderAll();
		console.log('Test circle added');
	});

	onDestroy(() => {
		if (canvas) {
			canvas.dispose();
		}
		window.removeEventListener('keydown', handleKeyDown);
	});

	function setupEventListeners() {
		canvas.on('mouse:down', handleMouseDown);
		canvas.on('mouse:move', handleMouseMove);
		canvas.on('mouse:up', handleMouseUp);
		window.addEventListener('keydown', handleKeyDown);
	}

	function handleMouseDown(event: any) {
		console.log('Mouse down event:', event);
		console.log('Event pointer:', event.pointer);
		console.log('Canvas exists:', !!canvas);
		console.log('Current tool:', currentTool);

		if (!event.pointer || !canvas) {
			console.log('Early return - no pointer or canvas');
			return;
		}
		const { x, y } = event.pointer;
		console.log('Click at:', x, y);

		if (currentTool === 'select') {
			const multiSelect = event.e.shiftKey;
			selection = selectTool.onClick(x, y, sketch, multiSelect);

			if (!selectTool.hasSelection()) {
				isDragging = true;
				dragStart = { x, y };
			}
		} else if (currentTool === 'point') {
			const point = pointTool.onClick(x, y, sketch);
			console.log('Point created:', point, 'Total points:', sketch.points.size);
			// Trigger Svelte reactivity
			sketch = sketch;
		} else if (currentTool === 'line') {
			const result = lineTool.onClick(x, y, sketch);
			if (result.line) {
				constraintSolver.solve(sketch);
			}
			// Trigger Svelte reactivity
			sketch = sketch;
		}

		renderSketch();
	}

	function handleMouseMove(event: any) {
		if (!event.pointer) return;
		const { x, y } = event.pointer;

		if (currentTool === 'select' && isDragging && dragStart) {
			selection = selectTool.onDrag(dragStart.x, dragStart.y, x, y, sketch);
			renderSketch();
			renderDragBox(dragStart, { x, y });
		} else if (currentTool === 'line') {
			const result = lineTool.onMouseMove(x, y, sketch);
			hoverPoint = result.snapPoint;
			renderSketch();
			renderLinePreview(x, y);
		} else if (currentTool === 'point') {
			hoverPoint = pointTool.findNearbyPoint(x, y, sketch);
			renderSketch();
		}
	}

	function handleMouseUp(event: any) {
		isDragging = false;
		dragStart = null;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (currentTool === 'line') {
				lineTool.reset();
			}
			selectTool.clearSelection();
			selection = { points: new Set(), lines: new Set() };
			renderSketch();
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			deleteSelected();
		} else if (event.key === 'p' || event.key === 'P') {
			setTool('point');
		} else if (event.key === 'l' || event.key === 'L') {
			setTool('line');
		} else if (event.key === 's' || event.key === 'S') {
			setTool('select');
		} else if (event.key === 'h' || event.key === 'H') {
			applyConstraint('horizontal');
		} else if (event.key === 'v' || event.key === 'V') {
			applyConstraint('vertical');
		}
	}

	function renderSketch() {
		canvas.clear();
		canvas.backgroundColor = '#ffffff';

		renderGrid();
		renderLines();
		renderPoints();
		renderProfiles();
		renderConstraintMarkers();

		canvas.renderAll();
	}

	function renderGrid() {
		const gridSize = 20;
		const width = canvas.width || 1000;
		const height = canvas.height || 700;

		for (let i = 0; i <= width; i += gridSize) {
			const line = new fabric.Line([i, 0, i, height], {
				stroke: '#e8e8e8',
				strokeWidth: 1,
				selectable: false,
				evented: false
			});
			canvas.add(line);
		}

		for (let i = 0; i <= height; i += gridSize) {
			const line = new fabric.Line([0, i, width, i], {
				stroke: '#e8e8e8',
				strokeWidth: 1,
				selectable: false,
				evented: false
			});
			canvas.add(line);
		}
	}

	function renderPoints() {
		console.log('Rendering points, total:', sketch.points.size);
		for (const point of sketch.points.values()) {
			const isSelected = selection.points.has(point.id);
			const isHovered = hoverPoint && hoverPoint.id === point.id;

			console.log('Rendering point at:', point.x, point.y);

			const circle = new fabric.Circle({
				left: point.x - 4,
				top: point.y - 4,
				radius: 4,
				fill: isSelected ? '#2563eb' : isHovered ? '#10b981' : point.fixed ? '#ef4444' : '#1f2937',
				stroke: isSelected ? '#1d4ed8' : isHovered ? '#059669' : 'transparent',
				strokeWidth: 2,
				selectable: false,
				evented: false
			});
			canvas.add(circle);
		}
	}

	function renderLines() {
		for (const line of sketch.lines.values()) {
			const start = sketch.points.get(line.startPointId);
			const end = sketch.points.get(line.endPointId);
			if (!start || !end) continue;

			const isSelected = selection.lines.has(line.id);

			const fabricLine = new fabric.Line([start.x, start.y, end.x, end.y], {
				stroke: isSelected ? '#2563eb' : line.construction ? '#9ca3af' : '#1f2937',
				strokeWidth: isSelected ? 3 : 2,
				selectable: false,
				evented: false,
				strokeDashArray: line.construction ? [5, 5] : undefined
			});
			canvas.add(fabricLine);
		}
	}

	function renderLinePreview(x: number, y: number) {
		const firstPoint = lineTool.getFirstPoint();
		if (firstPoint && lineTool.isWaitingForSecondPoint()) {
			const previewLine = new fabric.Line([firstPoint.x, firstPoint.y, x, y], {
				stroke: '#3b82f6',
				strokeWidth: 2,
				selectable: false,
				evented: false,
				strokeDashArray: [5, 5],
				opacity: 0.6
			});
			canvas.add(previewLine);
			canvas.renderAll();
		}
	}

	function renderDragBox(start: { x: number; y: number }, end: { x: number; y: number }) {
		const rect = new fabric.Rect({
			left: Math.min(start.x, end.x),
			top: Math.min(start.y, end.y),
			width: Math.abs(end.x - start.x),
			height: Math.abs(end.y - start.y),
			fill: 'rgba(59, 130, 246, 0.1)',
			stroke: '#3b82f6',
			strokeWidth: 1,
			strokeDashArray: [5, 5],
			selectable: false,
			evented: false
		});
		canvas.add(rect);
		canvas.renderAll();
	}

	function renderProfiles() {
		const profiles = profileDetector.detectClosedProfiles(sketch);
		sketch.profiles = profiles;

		for (const profile of profiles) {
			if (profile.isHole) continue;

			const points: { x: number; y: number }[] = [];
			for (const entityId of profile.entityIds) {
				const line = sketch.lines.get(entityId);
				if (!line) continue;
				const point = sketch.points.get(line.startPointId);
				if (point) points.push({ x: point.x, y: point.y });
			}

			if (points.length < 3) continue;

			const polygon = new fabric.Polygon(points, {
				fill: 'rgba(16, 185, 129, 0.08)',
				stroke: '#10b981',
				strokeWidth: 2,
				selectable: false,
				evented: false,
				opacity: 0.5
			});
			canvas.add(polygon);
		}
	}

	function renderConstraintMarkers() {
		for (const constraint of sketch.constraints.values()) {
			if (constraint.type === 'horizontal') {
				const line = sketch.lines.get(constraint.entities[0]);
				if (!line) continue;
				const start = sketch.points.get(line.startPointId);
				const end = sketch.points.get(line.endPointId);
				if (!start || !end) continue;

				const midX = (start.x + end.x) / 2;
				const midY = (start.y + end.y) / 2;

				const text = new fabric.Text('H', {
					left: midX,
					top: midY - 20,
					fontSize: 14,
					fill: '#2563eb',
					fontWeight: 'bold',
					selectable: false,
					evented: false,
					originX: 'center',
					originY: 'center'
				});
				canvas.add(text);
			} else if (constraint.type === 'vertical') {
				const line = sketch.lines.get(constraint.entities[0]);
				if (!line) continue;
				const start = sketch.points.get(line.startPointId);
				const end = sketch.points.get(line.endPointId);
				if (!start || !end) continue;

				const midX = (start.x + end.x) / 2;
				const midY = (start.y + end.y) / 2;

				const text = new fabric.Text('V', {
					left: midX + 20,
					top: midY,
					fontSize: 14,
					fill: '#2563eb',
					fontWeight: 'bold',
					selectable: false,
					evented: false,
					originX: 'center',
					originY: 'center'
				});
				canvas.add(text);
			}
		}
	}

	function setTool(tool: SketchTool) {
		currentTool = tool;
		lineTool.reset();
		selectTool.clearSelection();
		selection = { points: new Set(), lines: new Set() };
		renderSketch();
	}

	function applyConstraint(type: 'horizontal' | 'vertical' | 'parallel' | 'perpendicular') {
		const selectedLines = Array.from(selection.lines);

		if (selectedLines.length === 0) return;

		for (const lineId of selectedLines) {
			const constraint: Constraint = {
				id: `constraint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type,
				entities: [lineId],
				satisfied: false
			};
			sketch.constraints.set(constraint.id, constraint);
		}

		constraintSolver.solve(sketch);
		renderSketch();
	}

	function deleteSelected() {
		for (const lineId of selection.lines) {
			sketch.lines.delete(lineId);
		}
		for (const pointId of selection.points) {
			sketch.points.delete(pointId);
		}
		selectTool.clearSelection();
		selection = { points: new Set(), lines: new Set() };
		renderSketch();
	}

	function exitSketch() {
		onExitSketch();
	}
</script>

<div class="onshape-sketch-container">
	<div class="sketch-toolbar">
		<div class="toolbar-left">
			<div class="tool-group">
				<button
					class="tool-btn"
					class:active={currentTool === 'select'}
					on:click={() => setTool('select')}
					title="Select (S)"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
					</svg>
					<span>Select</span>
				</button>
				<button
					class="tool-btn"
					class:active={currentTool === 'point'}
					on:click={() => setTool('point')}
					title="Point (P)"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="3" fill="currentColor" />
					</svg>
					<span>Point</span>
				</button>
				<button
					class="tool-btn"
					class:active={currentTool === 'line'}
					on:click={() => setTool('line')}
					title="Line (L)"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="4" y1="20" x2="20" y2="4" />
					</svg>
					<span>Line</span>
				</button>
			</div>

			<div class="toolbar-divider"></div>

			<div class="tool-group">
				<button
					class="constraint-btn"
					on:click={() => applyConstraint('horizontal')}
					disabled={selection.lines.size === 0}
					title="Horizontal (H)"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="4" y1="12" x2="20" y2="12" />
					</svg>
					<span>Horizontal</span>
				</button>
				<button
					class="constraint-btn"
					on:click={() => applyConstraint('vertical')}
					disabled={selection.lines.size === 0}
					title="Vertical (V)"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="4" x2="12" y2="20" />
					</svg>
					<span>Vertical</span>
				</button>
			</div>
		</div>

		<div class="toolbar-center">
			<span class="plane-badge">{plane.name}</span>
		</div>

		<div class="toolbar-right">
			<button class="exit-btn" on:click={exitSketch}>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
				Finish Sketch
			</button>
		</div>
	</div>

	<div class="canvas-wrapper">
		<canvas bind:this={canvasElement}></canvas>
	</div>

	<div class="status-bar">
		<div class="status-item">
			<span class="status-label">Points:</span>
			<span class="status-value">{sketch.points.size}</span>
		</div>
		<div class="status-item">
			<span class="status-label">Lines:</span>
			<span class="status-value">{sketch.lines.size}</span>
		</div>
		<div class="status-item">
			<span class="status-label">Constraints:</span>
			<span class="status-value">{sketch.constraints.size}</span>
		</div>
		<div class="status-item">
			<span class="status-label">Profiles:</span>
			<span class="status-value">{sketch.profiles.length}</span>
		</div>
		{#if selection.points.size > 0 || selection.lines.size > 0}
			<div class="status-item highlight">
				<span class="status-label">Selected:</span>
				<span class="status-value">{selection.points.size}p, {selection.lines.size}l</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.onshape-sketch-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f8f9fa;
	}

	.sketch-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border-bottom: 2px solid #e5e7eb;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toolbar-left,
	.toolbar-right {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.toolbar-center {
		flex: 1;
		text-align: center;
	}

	.tool-group {
		display: flex;
		gap: 0.25rem;
		background: #f3f4f6;
		padding: 0.25rem;
		border-radius: 6px;
	}

	.tool-btn,
	.constraint-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		color: #374151;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.tool-btn:hover,
	.constraint-btn:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.tool-btn.active {
		background: #2563eb;
		color: white;
	}

	.constraint-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toolbar-divider {
		width: 1px;
		height: 30px;
		background: #d1d5db;
		margin: 0 0.5rem;
	}

	.plane-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		color: white;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.exit-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		background: #10b981;
		border: none;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.15s ease;
	}

	.exit-btn:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
	}

	.canvas-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: auto;
		background: #f8f9fa;
	}

	.status-bar {
		display: flex;
		gap: 1.5rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border-top: 1px solid #e5e7eb;
		font-size: 0.75rem;
	}

	.status-item {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.status-label {
		color: #6b7280;
		font-weight: 500;
	}

	.status-value {
		color: #1f2937;
		font-weight: 600;
	}

	.status-item.highlight {
		background: #dbeafe;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
	}

	.status-item.highlight .status-label,
	.status-item.highlight .status-value {
		color: #1e40af;
	}
</style>
