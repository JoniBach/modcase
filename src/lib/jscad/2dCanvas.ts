import { Canvas, Rect, Line, loadSVGFromString, Text, Point } from 'fabric';
import type { TPointerEventInfo, TPointerEvent, WheelEvent } from 'fabric';
import { serializeToSvg } from '$lib/utils/svgSerializer';

export const addGrid = (canvas: Canvas) => {
	const zoom = canvas.getZoom();
	const gridSize = Math.max(10, 50 / zoom);
	const extent = 20;
	const gridLines: (Line | Text)[] = [];

	// Remove existing grid
	canvas
		.getObjects()
		.filter((obj: any) => obj.isGrid)
		.forEach((obj: any) => canvas.remove(obj));

	const mmPerPixel = gridSize; // Assuming gridSize pixels = gridSize mm
	for (let i = -extent; i <= extent; i++) {
		// Vertical lines
		gridLines.push(
			new Line([i * gridSize, -extent * gridSize, i * gridSize, extent * gridSize], {
				stroke: i === 0 ? '#666' : '#3a3a3a',
				strokeWidth: (i === 0 ? 2 : 1) / zoom,
				selectable: false,
				evented: false,
				isGrid: true
			})
		);
		// Horizontal lines
		gridLines.push(
			new Line([-extent * gridSize, i * gridSize, extent * gridSize, i * gridSize], {
				stroke: i === 0 ? '#666' : '#3a3a3a',
				strokeWidth: (i === 0 ? 2 : 1) / zoom,
				selectable: false,
				evented: false,
				isGrid: true
			})
		);

		// Add mm labels
		if (i !== 0) {
			const vpt = canvas.viewportTransform;
			const tx = vpt[4];
			const ty = vpt[5];
			const mmValue = Math.round(i * mmPerPixel);
			// X-axis label (at grid x, screen top)
			const xLabel = new Text(`${mmValue}mm`, {
				left: i * gridSize,
				top: (10 - ty) / zoom,
				fontSize: 10 / zoom,
				fill: '#ccc',
				selectable: false,
				evented: false,
				originX: 'center',
				originY: 'center',
				isGrid: true
			});
			gridLines.push(xLabel);
			// Y-axis label (at grid y, screen left)
			const yLabel = new Text(`${mmValue}mm`, {
				left: (10 - tx) / zoom,
				top: i * gridSize,
				fontSize: 10 / zoom,
				fill: '#ccc',
				selectable: false,
				evented: false,
				originX: 'center',
				originY: 'center',
				isGrid: true
			});
			gridLines.push(yLabel);
		}
	}
	gridLines.forEach((line) => canvas.add(line));
	canvas.renderAll();
};

export const renderGeometry = (canvas: Canvas, geom: any) => {
	// Clear existing geometry
	canvas.getObjects().forEach((obj: any) => {
		if (!obj.isGrid) canvas.remove(obj);
	});

	// Serialize geometry to SVG
	const svgString = serializeToSvg(geom);

	// Load SVG into fabric
	loadSVGFromString(svgString)
		.then((result: any) => {
			result.objects.forEach((obj: any) => {
				// Scale and position the objects appropriately
				obj.scale(1); // Adjust scale as needed
				obj.set({
					left: 0,
					top: 0,
					selectable: false,
					originX: 'left',
					originY: 'bottom'
				});
				canvas.add(obj);
			});
			canvas.renderAll();
		})
		.catch((error: any) => {
			console.error('Error loading SVG:', error);
			// Fallback to simple shape
			const shape = new Rect({
				left: 0,
				top: 0,
				width: 10 * 50,
				height: 10 * 50,
				fill: 'rgba(255, 100, 100, 0.5)',
				stroke: '#ff4040',
				strokeWidth: 2,
				selectable: false,
				originX: 'center',
				originY: 'center'
			});
			canvas.add(shape);
			canvas.renderAll();
		});
};

export const enablePanZoom = (canvas: Canvas) => {
	let isPanning = false;
	let lastX: number, lastY: number;

	canvas.on('mouse:down', (opt: TPointerEventInfo<TPointerEvent>) => {
		if (opt.e.altKey || opt.e.button === 1) {
			isPanning = true;
			lastX = opt.e.clientX;
			lastY = opt.e.clientY;
		}
	});

	canvas.on('mouse:move', (opt: TPointerEventInfo<TPointerEvent>) => {
		if (isPanning) {
			const vpt = canvas.viewportTransform;
			vpt[4] += opt.e.clientX - lastX;
			vpt[5] += opt.e.clientY - lastY;
			canvas.requestRenderAll();
			lastX = opt.e.clientX;
			lastY = opt.e.clientY;
		}
	});

	canvas.on('mouse:up', () => {
		if (isPanning) {
			addGrid(canvas);
		}
		isPanning = false;
	});

	canvas.on('mouse:wheel', (opt: TPointerEventInfo<WheelEvent>) => {
		const delta = opt.e.deltaY;
		let zoom = canvas.getZoom();
		zoom *= 0.999 ** delta;
		zoom = Math.min(Math.max(0.1, zoom), 20);
		canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
		opt.e.preventDefault();
		opt.e.stopPropagation();
		addGrid(canvas);
	});
};

export const canvasTools = {
	addGrid,
	renderGeometry,
	enablePanZoom
};
