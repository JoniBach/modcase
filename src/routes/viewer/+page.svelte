<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import JscadViewer from '$lib/components/JscadViewer.svelte';
	import { models } from '$lib/jscad/models';
	import { loadSTLFile } from '$lib/utils/stlParser';
	import * as THREE from 'three';

	let viewer: any;
	let currentGeometry: any = null;
	let selectedModel = 'extrusion2020';
	let fileInput: HTMLInputElement;
	let isSTLMode = false;
	let fromSketch = false;

	onMount(() => {
		// Check if we came from sketch page with geometry
		const urlParams = new URLSearchParams(window.location.search);
		fromSketch = urlParams.get('from') === 'sketch';

		if (fromSketch) {
			const storedGeometry = sessionStorage.getItem('extrudedGeometry');
			if (storedGeometry) {
				try {
					currentGeometry = JSON.parse(storedGeometry);
					sessionStorage.removeItem('extrudedGeometry');
				} catch (error) {
					console.error('Failed to load extruded geometry:', error);
					loadModel('extrusion2020');
				}
			} else {
				loadModel('extrusion2020');
			}
		} else {
			loadModel('extrusion2020');
		}
	});

	async function loadModel(modelKey: string) {
		selectedModel = modelKey;
		isSTLMode = false;
		fromSketch = false;
		const model = models[modelKey as keyof typeof models];
		if (model) {
			const result = model.fn();
			if (result instanceof Promise) {
				currentGeometry = await result;
			} else {
				currentGeometry = result;
			}
		}
	}

	function handleExport() {
		if (viewer) {
			const modelName = fromSketch
				? 'sketch_model'
				: models[selectedModel as keyof typeof models]?.name || 'model';
			const filename = `${modelName.toLowerCase().replace(/\s+/g, '_')}.stl`;
			viewer.exportSTL(filename);
		}
	}

	async function handleSTLImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		try {
			const geometry = await loadSTLFile(file);
			isSTLMode = true;
			selectedModel = '';
			fromSketch = false;

			if (viewer) {
				viewer.loadSTLGeometry(geometry);
			}
		} catch (error) {
			console.error('Failed to load STL file:', error);
			alert('Failed to load STL file. Please ensure it is a valid STL file.');
		}

		input.value = '';
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="container">
	<header>
		<div class="header-content">
			<div>
				<h1>3D Viewer</h1>
				<p>View and export 3D models</p>
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
			{#if fromSketch}
				<div class="sketch-info">
					<h2>Your Sketch Model</h2>
					<p>This model was created from your 2D sketch</p>
					<button class="action-button" on:click={() => goto('/sketch')}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
						</svg>
						Back to Sketch
					</button>
				</div>
			{:else}
				<h2>Models</h2>
				<div class="model-list">
					{#each Object.entries(models) as [key, model]}
						<button
							class="model-button"
							class:active={selectedModel === key}
							on:click={() => loadModel(key)}
						>
							{model.name}
						</button>
					{/each}
				</div>
			{/if}

			<div class="export-section">
				<input
					type="file"
					accept=".stl"
					bind:this={fileInput}
					on:change={handleSTLImport}
					style="display: none;"
				/>
				<button class="import-button" on:click={triggerFileInput}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="17 8 12 3 7 8" />
						<line x1="12" y1="3" x2="12" y2="15" />
					</svg>
					Import STL
				</button>
				<button class="export-button" on:click={handleExport}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Export as STL
				</button>
			</div>

			<div class="info">
				<h3>Controls</h3>
				<ul>
					<li><strong>Left Mouse:</strong> Rotate</li>
					<li><strong>Right Mouse:</strong> Pan</li>
					<li><strong>Scroll:</strong> Zoom</li>
				</ul>
			</div>
		</aside>

		<main class="viewer-section">
			<JscadViewer bind:this={viewer} geometry={currentGeometry} />
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
		width: 280px;
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

	.sketch-info {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
		border: 2px solid rgba(102, 126, 234, 0.3);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.sketch-info h2 {
		margin: 0 0 0.5rem 0;
		color: #667eea;
	}

	.sketch-info p {
		margin: 0 0 1rem 0;
		color: #aaa;
		font-size: 0.9rem;
	}

	.action-button {
		width: 100%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.action-button:hover {
		background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.model-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.model-button {
		background: #2a2a2a;
		border: 2px solid #3a3a3a;
		color: #e0e0e0;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: all 0.2s ease;
		text-align: left;
	}

	.model-button:hover {
		background: #3a3a3a;
		border-color: #667eea;
		transform: translateX(4px);
	}

	.model-button.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: #667eea;
		color: white;
		font-weight: 600;
	}

	.export-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #333;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.import-button {
		width: 100%;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
	}

	.import-button:hover {
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.import-button:active {
		transform: translateY(0);
	}

	.export-button {
		width: 100%;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
	}

	.export-button:hover {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
	}

	.export-button:active {
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

	.viewer-section {
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
