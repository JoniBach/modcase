<script lang="ts">
	import { goto } from '$app/navigation';

	const features = [
		{
			title: '2D Sketch Editor',
			description: 'Draw 2D shapes and extrude them into 3D models',
			icon: 'sketch',
			path: '/sketch',
			color: 'from-purple-500 to-pink-500'
		},
		{
			title: '3D Model Viewer',
			description: 'View, manipulate, and export 3D models as STL files',
			icon: 'viewer',
			path: '/viewer',
			color: 'from-blue-500 to-cyan-500'
		}
	];

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="container">
	<header>
		<h1>OpenJSCAD 3D Modeling</h1>
		<p>Interactive 3D modeling with Svelte and OpenJSCAD</p>
	</header>

	<main class="main-content">
		<div class="hero">
			<h2>Welcome to OpenJSCAD 3D Modeling</h2>
			<p class="subtitle">
				Create 3D models from 2D sketches or explore pre-built parametric designs
			</p>
		</div>

		<div class="features-grid">
			{#each features as feature}
				<button class="feature-card" on:click={() => navigateTo(feature.path)}>
					<div class="feature-icon {feature.icon}">
						{#if feature.icon === 'sketch'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="48"
								height="48"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 20h9" />
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
							</svg>
						{:else}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="48"
								height="48"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
								/>
							</svg>
						{/if}
					</div>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
					<div class="arrow">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="5" y1="12" x2="19" y2="12" />
							<polyline points="12 5 19 12 12 19" />
						</svg>
					</div>
				</button>
			{/each}
		</div>

		<div class="info-section">
			<h3>Features</h3>
			<div class="info-grid">
				<div class="info-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polyline points="16 18 22 12 16 6" />
						<polyline points="8 6 2 12 8 18" />
					</svg>
					<div>
						<h4>Parametric Design</h4>
						<p>Create precise, customizable 3D models</p>
					</div>
				</div>
				<div class="info-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					<div>
						<h4>STL Export</h4>
						<p>Export models for 3D printing</p>
					</div>
				</div>
				<div class="info-item">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					<div>
						<h4>Real-time Preview</h4>
						<p>See changes instantly in 3D</p>
					</div>
				</div>
			</div>
		</div>
	</main>
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
		min-height: 100vh;
	}

	header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		text-align: center;
	}

	header h1 {
		margin: 0;
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
	}

	header p {
		margin: 0.5rem 0 0 0;
		font-size: 1.1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.main-content {
		flex: 1;
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		padding: 3rem 2rem;
	}

	.hero {
		text-align: center;
		margin-bottom: 4rem;
	}

	.hero h2 {
		font-size: 2.5rem;
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		font-size: 1.2rem;
		color: #aaa;
		margin: 0;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 4rem;
	}

	.feature-card {
		background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
		border: 2px solid #3a3a3a;
		border-radius: 16px;
		padding: 2.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.feature-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-8px);
		border-color: #667eea;
		box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
	}

	.feature-card:hover::before {
		opacity: 1;
	}

	.feature-icon {
		width: 80px;
		height: 80px;
		margin: 0 auto 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
	}

	.feature-icon svg {
		color: #667eea;
	}

	.feature-card h3 {
		margin: 0 0 1rem 0;
		font-size: 1.5rem;
		color: white;
	}

	.feature-card p {
		margin: 0 0 1.5rem 0;
		color: #aaa;
		font-size: 1rem;
		line-height: 1.6;
	}

	.arrow {
		display: flex;
		justify-content: center;
		opacity: 0.5;
		transition: all 0.3s ease;
	}

	.feature-card:hover .arrow {
		opacity: 1;
		transform: translateX(4px);
	}

	.arrow svg {
		color: #667eea;
	}

	.info-section {
		background: #1a1a1a;
		border: 2px solid #3a3a3a;
		border-radius: 16px;
		padding: 2.5rem;
	}

	.info-section h3 {
		margin: 0 0 2rem 0;
		font-size: 1.8rem;
		text-align: center;
		color: white;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.info-item {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.info-item svg {
		flex-shrink: 0;
		color: #667eea;
	}

	.info-item h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		color: white;
	}

	.info-item p {
		margin: 0;
		color: #aaa;
		font-size: 0.95rem;
	}

	@media (max-width: 768px) {
		header h1 {
			font-size: 2rem;
		}

		.hero h2 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.info-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
