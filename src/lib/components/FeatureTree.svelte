<script lang="ts">
	import type { Part, SketchPlane, Sketch, ExtrudeFeature } from '../sketch/types';

	export let part: Part;
	export let onSelectPlane: (planeId: string) => void;
	export let onSelectSketch: (sketchId: string) => void;
	export let onSelectFeature: (featureId: string) => void;

	let expandedOrigin = true;
	let expandedSketches = true;
	let expandedFeatures = true;

	function toggleSection(section: 'origin' | 'sketches' | 'features') {
		if (section === 'origin') expandedOrigin = !expandedOrigin;
		if (section === 'sketches') expandedSketches = !expandedSketches;
		if (section === 'features') expandedFeatures = !expandedFeatures;
	}
</script>

<div class="feature-tree">
	<div class="tree-header">
		<h3>Part Studio</h3>
	</div>

	<div class="tree-content">
		<!-- Origin Section -->
		<div class="tree-section">
			<button class="section-header" on:click={() => toggleSection('origin')}>
				<span class="expand-icon">{expandedOrigin ? '▼' : '▶'}</span>
				<span class="section-title">Origin</span>
			</button>
			{#if expandedOrigin}
				<div class="section-items">
					{#each Array.from(part.planes.values()) as plane}
						<button class="tree-item plane-item" on:click={() => onSelectPlane(plane.id)}>
							<span class="item-icon">📐</span>
							<span class="item-name">{plane.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Sketches Section -->
		<div class="tree-section">
			<button class="section-header" on:click={() => toggleSection('sketches')}>
				<span class="expand-icon">{expandedSketches ? '▼' : '▶'}</span>
				<span class="section-title">Sketches</span>
				<span class="count-badge">{part.sketches.size}</span>
			</button>
			{#if expandedSketches}
				<div class="section-items">
					{#if part.sketches.size === 0}
						<div class="empty-message">No sketches yet</div>
					{:else}
						{#each Array.from(part.sketches.values()) as sketch}
							<button class="tree-item sketch-item" on:click={() => onSelectSketch(sketch.id)}>
								<span class="item-icon">✏️</span>
								<span class="item-name">Sketch {sketch.id.slice(0, 8)}</span>
								<span class="item-detail">{sketch.lines.size} lines</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>

		<!-- Features Section -->
		<div class="tree-section">
			<button class="section-header" on:click={() => toggleSection('features')}>
				<span class="expand-icon">{expandedFeatures ? '▼' : '▶'}</span>
				<span class="section-title">Features</span>
				<span class="count-badge">{part.features.length}</span>
			</button>
			{#if expandedFeatures}
				<div class="section-items">
					{#if part.features.length === 0}
						<div class="empty-message">No features yet</div>
					{:else}
						{#each part.features as feature}
							<button class="tree-item feature-item" on:click={() => onSelectFeature(feature.id)}>
								<span class="item-icon">🔲</span>
								<span class="item-name">Extrude {feature.id.slice(0, 8)}</span>
								<span class="item-detail">{feature.distance}mm</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.feature-tree {
		width: 250px;
		height: 100%;
		background: #1a1a1a;
		border-right: 1px solid #333;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.tree-header {
		padding: 1rem;
		border-bottom: 1px solid #333;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.tree-header h3 {
		margin: 0;
		color: white;
		font-size: 1rem;
		font-weight: 600;
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
	}

	.tree-section {
		margin-bottom: 0.5rem;
	}

	.section-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		color: #e0e0e0;
		cursor: pointer;
		transition: background 0.2s ease;
		text-align: left;
	}

	.section-header:hover {
		background: rgba(102, 126, 234, 0.1);
	}

	.expand-icon {
		font-size: 0.75rem;
		color: #999;
	}

	.section-title {
		flex: 1;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.count-badge {
		background: #667eea;
		color: white;
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.section-items {
		padding-left: 0.5rem;
	}

	.tree-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: #ccc;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		border-left: 2px solid transparent;
	}

	.tree-item:hover {
		background: rgba(102, 126, 234, 0.15);
		border-left-color: #667eea;
		color: #e0e0e0;
	}

	.item-icon {
		font-size: 1rem;
	}

	.item-name {
		flex: 1;
		font-size: 0.875rem;
	}

	.item-detail {
		font-size: 0.75rem;
		color: #999;
	}

	.empty-message {
		padding: 1rem;
		text-align: center;
		color: #666;
		font-size: 0.875rem;
		font-style: italic;
	}

	.plane-item:hover {
		border-left-color: #10b981;
	}

	.sketch-item:hover {
		border-left-color: #667eea;
	}

	.feature-item:hover {
		border-left-color: #f59e0b;
	}

	::-webkit-scrollbar {
		width: 8px;
	}

	::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	::-webkit-scrollbar-thumb {
		background: #3a3a3a;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #4a4a4a;
	}
</style>
