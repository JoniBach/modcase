<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Sketch, SketchTool, SketchPlane } from '../sketch/types';
	import { PointTool } from '../sketch/PointTool';
	import { SelectTool, type Selection } from '../sketch/SelectTool';
	import { ImprovedLineTool } from '../sketch/ImprovedLineTool';
	import { ConstraintSolver } from '../sketch/ConstraintSolver';
	import { ProfileDetector } from '../sketch/ProfileDetector';

	export let sketch: Sketch;
	export let plane: SketchPlane;
	export let onExitSketch: () => void;

	let canvasElement: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
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

	// Unit system - default to mm with 1px = 1mm scale
	let currentUnit = 'mm';
	let pixelsPerUnit = 1; // 1 pixel = 1mm
	let gridSpacing = 10; // 10mm grid

	onMount(() => {
		ctx = canvasElement.getContext('2d');
		if (ctx) {
			canvasElement.width = 1000;
			canvasElement.height = 700;
			render();
		}
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	function handleCanvasClick(event: MouseEvent) {
		if (!ctx) return;

		const rect = canvasElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		console.log('Canvas clicked at:', x, y, 'Tool:', currentTool);

		if (currentTool === 'point') {
			const point = pointTool.onClick(x, y, sketch);
			console.log('Point created:', point);
			sketch = sketch;
		} else if (currentTool === 'line') {
			const result = lineTool.onClick(x, y, sketch);
			console.log('Line result:', result);
			if (result.line) {
				constraintSolver.solve(sketch);
			}
			sketch = sketch;
		} else if (currentTool === 'select') {
			const multiSelect = event.shiftKey;
			selection = selectTool.onClick(x, y, sketch, multiSelect);
		}

		render();
	}

	function handleCanvasMouseMove(event: MouseEvent) {
		if (!ctx) return;

		const rect = canvasElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		if (currentTool === 'point') {
			hoverPoint = pointTool.findNearbyPoint(x, y, sketch);
			render();
		} else if (currentTool === 'line') {
			const result = lineTool.onMouseMove(x, y, sketch);
			hoverPoint = result.snapPoint;
			render();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			lineTool.reset();
			selectTool.clearSelection();
			selection = { points: new Set(), lines: new Set() };
			render();
		} else if (event.key === 'p' || event.key === 'P') {
			setTool('point');
		} else if (event.key === 'l' || event.key === 'L') {
			setTool('line');
		} else if (event.key === 's' || event.key === 'S') {
			setTool('select');
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			deleteSelected();
		} else if (event.key === 'h' || event.key === 'H') {
			applyConstraint('horizontal');
		} else if (event.key === 'v' || event.key === 'V') {
			applyConstraint('vertical');
		}
	}

	function render() {
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

		// Draw grid (in mm)
		ctx.strokeStyle = '#e8e8e8';
		ctx.lineWidth = 1;
		for (let i = 0; i <= canvasElement.width; i += gridSpacing) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, canvasElement.height);
			ctx.stroke();
		}
		for (let i = 0; i <= canvasElement.height; i += gridSpacing) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(canvasElement.width, i);
			ctx.stroke();
		}

		// Draw grid labels every 50mm
		ctx.fillStyle = '#9ca3af';
		ctx.font = '10px sans-serif';
		for (let i = 50; i <= canvasElement.width; i += 50) {
			ctx.fillText(`${i}mm`, i + 2, 12);
		}
		for (let i = 50; i <= canvasElement.height; i += 50) {
			ctx.fillText(`${i}mm`, 2, i - 2);
		}

		// Draw lines
		for (const line of sketch.lines.values()) {
			const start = sketch.points.get(line.startPointId);
			const end = sketch.points.get(line.endPointId);
			if (!start || !end) continue;

			const isSelected = selection.lines.has(line.id);
			ctx.strokeStyle = isSelected ? '#2563eb' : '#1f2937';
			ctx.lineWidth = isSelected ? 3 : 2;

			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}

		// Draw line preview
		const firstPoint = lineTool.getFirstPoint();
		if (firstPoint && lineTool.isWaitingForSecondPoint() && hoverPoint) {
			ctx.strokeStyle = '#3b82f6';
			ctx.lineWidth = 2;
			ctx.setLineDash([5, 5]);
			ctx.beginPath();
			ctx.moveTo(firstPoint.x, firstPoint.y);
			ctx.lineTo(hoverPoint.x || 0, hoverPoint.y || 0);
			ctx.stroke();
			ctx.setLineDash([]);
		}

		// Draw points
		console.log('Drawing points, total:', sketch.points.size);
		for (const point of sketch.points.values()) {
			const isSelected = selection.points.has(point.id);
			const isHovered = hoverPoint && hoverPoint.id === point.id;

			ctx.fillStyle = isSelected ? '#2563eb' : isHovered ? '#10b981' : '#1f2937';
			ctx.beginPath();
			ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
			ctx.fill();

			if (isSelected || isHovered) {
				ctx.strokeStyle = isSelected ? '#1d4ed8' : '#059669';
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}

		// Draw profiles
		const profiles = profileDetector.detectClosedProfiles(sketch);
		sketch.profiles = profiles;

		console.log('Profiles detected:', profiles.length);
		console.log('Lines in sketch:', sketch.lines.size);

		for (const profile of profiles) {
			console.log(
				'Profile:',
				profile.id,
				'Entities:',
				profile.entityIds.length,
				'IsHole:',
				profile.isHole
			);
			if (profile.isHole) continue;

			const points: { x: number; y: number }[] = [];
			for (const entityId of profile.entityIds) {
				const line = sketch.lines.get(entityId);
				if (!line) continue;
				const point = sketch.points.get(line.startPointId);
				if (point) points.push({ x: point.x, y: point.y });
			}

			console.log('Profile points collected:', points.length);

			if (points.length >= 3) {
				console.log('Drawing green profile fill');
				ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
				ctx.strokeStyle = '#10b981';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(points[0].x, points[0].y);
				for (let i = 1; i < points.length; i++) {
					ctx.lineTo(points[i].x, points[i].y);
				}
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
			}
		}
	}

	function setTool(tool: SketchTool) {
		currentTool = tool;
		lineTool.reset();
		selectTool.clearSelection();
		selection = { points: new Set(), lines: new Set() };
		render();
	}

	function applyConstraint(type: 'horizontal' | 'vertical') {
		const selectedLines = Array.from(selection.lines);
		if (selectedLines.length === 0) return;

		for (const lineId of selectedLines) {
			const constraint = {
				id: `constraint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type,
				entities: [lineId],
				satisfied: false
			};
			sketch.constraints.set(constraint.id, constraint);
		}

		constraintSolver.solve(sketch);
		render();
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
		render();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});
</script>

<div class="sketch-container">
	<div class="sketch-toolbar">
		<div class="toolbar-left">
			<div class="tool-group">
				<button
					class="tool-btn"
					class:active={currentTool === 'select'}
					on:click={() => setTool('select')}
				>
					Select (S)
				</button>
				<button
					class="tool-btn"
					class:active={currentTool === 'point'}
					on:click={() => setTool('point')}
				>
					Point (P)
				</button>
				<button
					class="tool-btn"
					class:active={currentTool === 'line'}
					on:click={() => setTool('line')}
				>
					Line (L)
				</button>
			</div>
			<div class="tool-group">
				<button
					class="constraint-btn"
					on:click={() => applyConstraint('horizontal')}
					disabled={selection.lines.size === 0}
				>
					Horizontal (H)
				</button>
				<button
					class="constraint-btn"
					on:click={() => applyConstraint('vertical')}
					disabled={selection.lines.size === 0}
				>
					Vertical (V)
				</button>
			</div>
		</div>
		<div class="toolbar-center">
			<span class="plane-badge">{plane.name}</span>
		</div>
		<div class="toolbar-right">
			<button
				class="exit-btn"
				on:click={() => {
					console.log('Finish Sketch clicked');
					onExitSketch();
				}}>Finish Sketch</button
			>
		</div>
	</div>

	<div class="canvas-wrapper">
		<canvas
			bind:this={canvasElement}
			on:click={handleCanvasClick}
			on:mousemove={handleCanvasMouseMove}
		></canvas>
	</div>

	<div class="status-bar">
		<span class="unit-badge">Units: {currentUnit}</span>
		<span>Points: {sketch.points.size}</span>
		<span>Lines: {sketch.lines.size}</span>
		<span>Constraints: {sketch.constraints.size}</span>
		<span>Profiles: {sketch.profiles.length}</span>
		{#if selection.points.size > 0 || selection.lines.size > 0}
			<span class="highlight">Selected: {selection.points.size}p, {selection.lines.size}l</span>
		{/if}
	</div>
</div>

<style>
	.sketch-container {
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
		gap: 1rem;
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

	.plane-badge {
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		color: white;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.exit-btn {
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
	}

	.canvas-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: auto;
	}

	canvas {
		border: 2px solid #d1d5db;
		border-radius: 4px;
		cursor: crosshair;
		background: white;
	}

	.status-bar {
		display: flex;
		gap: 1.5rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border-top: 1px solid #e5e7eb;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-bar span {
		font-weight: 500;
	}

	.status-bar .unit-badge {
		background: #10b981;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.status-bar .highlight {
		background: #dbeafe;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		color: #1e40af;
		font-weight: 600;
	}
</style>
