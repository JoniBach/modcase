<script lang="ts">
	import { goto } from '$app/navigation';
	import SketchEditor from '$lib/components/SketchEditor.svelte';
	import { extrudeSketch, revolveSketch, validateSketchData } from '$lib/utils/sketchTo3D';
	import type { SketchShape } from '$lib/utils/sketchTo3D';

	let sketchEditor: any;
	let extrusionHeight = 10;
	let extrusionTwist = 0;
	let extrusionScale = 1;
	let extrusionType: 'linear' | 'revolve' = 'linear';
	let revolutionAngle = 360;
	let revolutionSegments = 32;

	async function extrudeFromSketch() {
		if (!sketchEditor) {
			alert('Sketch editor not initialized');
			return;
		}

		const sketchData: SketchShape[] = sketchEditor.getSketchData();

		const validation = validateSketchData(sketchData);
		if (!validation.valid) {
			alert(validation.error || 'Invalid sketch data');
			return;
		}

		try {
			let geometry;

			if (extrusionType === 'linear') {
				geometry = extrudeSketch(sketchData, {
					height: extrusionHeight,
					twist: extrusionTwist,
					scale: extrusionScale
				});
			} else {
				geometry = revolveSketch(sketchData, {
					angle: revolutionAngle,
					segments: revolutionSegments
				});
			}

			// Store geometry in sessionStorage to pass to 3D viewer
			sessionStorage.setItem('extrudedGeometry', JSON.stringify(geometry));

			// Navigate to 3D viewer
			goto('/viewer?from=sketch');
		} catch (error) {
			console.error('Failed to extrude sketch:', error);
			alert('Failed to extrude sketch. Please check your sketch and try again.');
		}
	}
</script>

<div class="container">
	<header>
		<div class="header-content">
			<div>
				<h1>2D Sketch Editor</h1>
				<p>Draw shapes and extrude them into 3D models</p>
			</div>
			<button class="nav-button" on:click={() => goto('/')}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
					<polyline points="9 22 9 12 15 12 15 22" />
				</svg>
				Home
			</button>
		</div>
	</header>

	<div class="main-content">
		<aside class="sidebar">
			<h2>Extrusion Settings</h2>
			<div class="extrusion-controls">
				<div class="control-group">
					<label for="extrusion-type">Type:</label>
					<select id="extrusion-type" bind:value={extrusionType}>
						<option value="linear">Linear Extrude</option>
						<option value="revolve">Revolve</option>
					</select>
				</div>

				{#if extrusionType === 'linear'}
					<div class="control-group">
						<label for="extrusion-height">Height: {extrusionHeight}</label>
						<input
							id="extrusion-height"
							type="range"
							min="1"
							max="100"
							step="1"
							bind:value={extrusionHeight}
						/>
					</div>

					<div class="control-group">
						<label for="extrusion-twist">Twist (°): {extrusionTwist}</label>
						<input
							id="extrusion-twist"
							type="range"
							min="0"
							max="360"
							step="5"
							bind:value={extrusionTwist}
						/>
					</div>

					<div class="control-group">
						<label for="extrusion-scale">Scale: {extrusionScale.toFixed(2)}</label>
						<input
							id="extrusion-scale"
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							bind:value={extrusionScale}
						/>
					</div>
				{:else}
					<div class="control-group">
						<label for="revolution-angle">Angle (°): {revolutionAngle}</label>
						<input
							id="revolution-angle"
							type="range"
							min="30"
							max="360"
							step="10"
							bind:value={revolutionAngle}
						/>
					</div>

					<div class="control-group">
						<label for="revolution-segments">Segments: {revolutionSegments}</label>
						<input
							id="revolution-segments"
							type="range"
							min="8"
							max="64"
							step="4"
							bind:value={revolutionSegments}
						/>
					</div>
				{/if}

				<button class="extrude-button" on:click={extrudeFromSketch}>
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
							d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
						/>
						<polyline points="7.5 10.5 12 13 16.5 10.5" />
					</svg>
					Extrude to 3D
				</button>
			</div>

			<div class="info">
				<h3>Instructions</h3>
				<ul>
					<li><strong>Select Tool:</strong> Move/resize shapes</li>
					<li><strong>Rectangle/Circle:</strong> Click to place</li>
					<li><strong>Polygon:</strong> Click points, then finish</li>
					<li><strong>Path:</strong> Draw freeform</li>
				</ul>
			</div>
		</aside>

		<main class="editor-section">
			<SketchEditor bind:this={sketchEditor} onSketchReady={() => {}} />
		</main>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #0f0f0f;
		color: #e0e0e0;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1.5rem 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	header h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		color: white;
	}

	header p {
		margin: 0.5rem 0 0 0;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.nav-button {
		background: rgba(255, 255, 255, 0.2);
		border: 2px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-button:hover {
		background: rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
	}

	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.sidebar {
		width: 320px;
		background: #1a1a1a;
		padding: 1.5rem;
		overflow-y: auto;
		border-right: 1px solid #333;
	}

	.sidebar h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: #fff;
		font-weight: 600;
	}

	.sidebar h3 {
		margin: 2rem 0 0.75rem 0;
		font-size: 1rem;
		color: #aaa;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.extrusion-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.control-group label {
		color: #aaa;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.control-group input[type='range'] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #3a3a3a;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
	}

	.control-group input[type='range']::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		cursor: pointer;
	}

	.control-group input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		cursor: pointer;
		border: none;
	}

	.control-group select {
		background: #2a2a2a;
		border: 2px solid #3a3a3a;
		color: #e0e0e0;
		padding: 0.5rem;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.control-group select:focus {
		outline: none;
		border-color: #667eea;
	}

	.extrude-button {
		width: 100%;
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		border: none;
		color: white;
		padding: 0.875rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.extrude-button:hover {
		background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
	}

	.extrude-button:active {
		transform: translateY(0);
	}

	.info {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid #333;
	}

	.info ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.info li {
		padding: 0.5rem 0;
		color: #aaa;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.info strong {
		color: #667eea;
		font-weight: 600;
	}

	.editor-section {
		flex: 1;
		background: #1a1a1a;
		position: relative;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.main-content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			max-height: 40vh;
			border-right: none;
			border-bottom: 1px solid #333;
		}
	}
</style>
