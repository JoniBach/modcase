<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as fabric from 'fabric';
	import type { Sketch, SketchTool, ConstraintSuggestion, SketchPlane } from '../sketch/types';
	import { LineTool, ConstraintSuggester } from '../sketch/LineTool';
	import { ConstraintSolver } from '../sketch/ConstraintSolver';
	import { ProfileDetector } from '../sketch/ProfileDetector';

	export let sketch: Sketch;
	export let plane: SketchPlane;
	export let onExitSketch: () => void;

	let canvasElement: HTMLCanvasElement;
	let canvas: fabric.Canvas;
	let currentTool: SketchTool = 'line';
	let lineTool = new LineTool();
	let constraintSuggester = new ConstraintSuggester();
	let constraintSolver = new ConstraintSolver();
	let profileDetector = new ProfileDetector();
	let suggestions: ConstraintSuggestion[] = [];
	let nearbyPoint: any = null;

	onMount(() => {
		canvas = new fabric.Canvas(canvasElement, {
			width: 800,
			height: 600,
			backgroundColor: '#f5f5f5',
			selection: false
		});

		renderSketch();
		setupEventListeners();
	});

	onDestroy(() => {
		if (canvas) {
			canvas.dispose();
		}
	});

	function setupEventListeners() {
		canvas.on('mouse:down', handleMouseDown);
		canvas.on('mouse:move', handleMouseMove);
		window.addEventListener('keydown', handleKeyDown);
	}

	function handleMouseDown(event: any) {
		if (!event.pointer) return;

		const { x, y } = event.pointer;

		if (currentTool === 'line') {
			lineTool.onClick(x, y, sketch);

			const lastLineId = Array.from(sketch.lines.keys()).pop();
			if (lastLineId) {
				const line = sketch.lines.get(lastLineId);
				if (line) {
					suggestions = constraintSuggester.onLineCreated(line, sketch);
				}
			}

			constraintSolver.solve(sketch);
			renderSketch();
		}
	}

	function handleMouseMove(event: any) {
		if (!event.pointer) return;

		const { x, y } = event.pointer;

		if (currentTool === 'line') {
			const result = lineTool.onMouseMove(x, y, sketch);
			nearbyPoint = result.nearbyPoint;
			renderSketch();
			renderPreview();
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			lineTool.onEscape();
			suggestions = [];
			renderSketch();
		} else if (event.key === 'l' || event.key === 'L') {
			currentTool = 'line';
		} else if (event.key === 'd' || event.key === 'D') {
			currentTool = 'dimension';
		}
	}

	function renderSketch() {
		canvas.clear();
		canvas.backgroundColor = '#f5f5f5';

		renderGrid();
		renderPoints();
		renderLines();
		renderConstraintIcons();
		renderProfiles();

		canvas.renderAll();
	}

	function renderGrid() {
		const gridSize = 20;
		const width = canvas.width || 800;
		const height = canvas.height || 600;

		for (let i = 0; i <= width; i += gridSize) {
			const line = new fabric.Line([i, 0, i, height], {
				stroke: '#e0e0e0',
				strokeWidth: 1,
				selectable: false,
				evented: false
			});
			canvas.add(line);
		}

		for (let i = 0; i <= height; i += gridSize) {
			const line = new fabric.Line([0, i, width, i], {
				stroke: '#e0e0e0',
				strokeWidth: 1,
				selectable: false,
				evented: false
			});
			canvas.add(line);
		}
	}

	function renderPoints() {
		for (const point of sketch.points.values()) {
			const isNearby = nearbyPoint && nearbyPoint.id === point.id;
			const circle = new fabric.Circle({
				left: point.x - 3,
				top: point.y - 3,
				radius: 3,
				fill: point.fixed ? '#ff4444' : isNearby ? '#00ff00' : '#333',
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

			const fabricLine = new fabric.Line([start.x, start.y, end.x, end.y], {
				stroke: line.construction ? '#999' : '#333',
				strokeWidth: 2,
				selectable: false,
				evented: false,
				strokeDashArray: line.construction ? [5, 5] : undefined
			});
			canvas.add(fabricLine);
		}
	}

	function renderPreview() {
		const preview = lineTool.getPreviewLine();
		if (preview) {
			const previewLine = new fabric.Line(
				[preview.start.x, preview.start.y, preview.end.x, preview.end.y],
				{
					stroke: '#667eea',
					strokeWidth: 2,
					selectable: false,
					evented: false,
					strokeDashArray: [5, 5],
					opacity: 0.7
				}
			);
			canvas.add(previewLine);
			canvas.renderAll();
		}
	}

	function renderConstraintIcons() {
		for (const suggestion of suggestions) {
			const text = new fabric.Text(suggestion.icon, {
				left: suggestion.position.x,
				top: suggestion.position.y,
				fontSize: 16,
				fill: '#667eea',
				selectable: true,
				evented: true
			});

			text.on('mousedown', () => {
				sketch.constraints.set(suggestion.constraint.id, suggestion.constraint);
				constraintSolver.solve(sketch);
				suggestions = suggestions.filter((s) => s !== suggestion);
				renderSketch();
			});

			canvas.add(text);
		}
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
				fill: 'rgba(102, 126, 234, 0.1)',
				stroke: '#10b981',
				strokeWidth: 2,
				selectable: false,
				evented: false
			});
			canvas.add(polygon);
		}
	}

	function setTool(tool: SketchTool) {
		currentTool = tool;
		lineTool.reset();
		suggestions = [];
		renderSketch();
	}

	function exitSketch() {
		onExitSketch();
	}
</script>

<div class="sketch-canvas-container">
	<div class="sketch-toolbar">
		<div class="toolbar-section">
			<button
				class="tool-btn"
				class:active={currentTool === 'select'}
				on:click={() => setTool('select')}
			>
				Select
			</button>
			<button
				class="tool-btn"
				class:active={currentTool === 'line'}
				on:click={() => setTool('line')}
			>
				Line (L)
			</button>
			<button
				class="tool-btn"
				class:active={currentTool === 'dimension'}
				on:click={() => setTool('dimension')}
			>
				Dimension (D)
			</button>
		</div>
		<div class="toolbar-section">
			<span class="plane-name">{plane.name}</span>
		</div>
		<div class="toolbar-section">
			<button class="exit-btn" on:click={exitSketch}>Exit Sketch</button>
		</div>
	</div>

	<div class="canvas-wrapper">
		<canvas bind:this={canvasElement}></canvas>
	</div>

	<div class="status-bar">
		<span>Sketch: {sketch.id}</span>
		<span>Points: {sketch.points.size}</span>
		<span>Lines: {sketch.lines.size}</span>
		<span>Profiles: {sketch.profiles.length}</span>
	</div>
</div>

<style>
	.sketch-canvas-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #2a2a2a;
	}

	.sketch-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #1a1a1a;
		border-bottom: 2px solid #667eea;
	}

	.toolbar-section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.tool-btn {
		padding: 0.5rem 1rem;
		background: #2a2a2a;
		border: 2px solid #3a3a3a;
		color: #e0e0e0;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.tool-btn:hover {
		background: #3a3a3a;
		border-color: #667eea;
	}

	.tool-btn.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: #667eea;
		color: white;
	}

	.plane-name {
		color: #667eea;
		font-weight: 600;
		font-size: 1rem;
	}

	.exit-btn {
		padding: 0.5rem 1.5rem;
		background: #10b981;
		border: none;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 600;
	}

	.exit-btn:hover {
		background: #059669;
		transform: translateY(-1px);
	}

	.canvas-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		overflow: auto;
	}

	.status-bar {
		display: flex;
		gap: 2rem;
		padding: 0.5rem 1rem;
		background: #1a1a1a;
		border-top: 1px solid #333;
		color: #999;
		font-size: 0.75rem;
	}

	.status-bar span {
		display: flex;
		align-items: center;
	}
</style>
