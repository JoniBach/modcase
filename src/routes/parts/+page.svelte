<script>
	import { partList } from '$lib/jscad/parts';
	import { toolList } from '$lib/jscad/tools';
	import { shapeList } from '$lib/jscad/shapes';
</script>

<div class="container">
	<div class="header">
		<h1>Parts</h1>
	</div>
	<div class="menu">
		<h2>parts</h2>
		{#each partList as part}
			<p>{part.name}</p>
		{/each}
		<h2>tools</h2>
		{#each toolList as tool}
			<p>{tool.name}</p>
		{/each}
		<h2>shapes</h2>
		{#each shapeList as shape}
			<p>{shape.name}</p>
		{/each}
	</div>

	<div class="content">content</div>
</div>

<style>
	.container {
		display: flex;
		flex-wrap: wrap;
		height: 100vh;
		background-color: #777;
	}
	.header {
		width: 100%;
		background-color: #333;
		max-height: 100px;
		padding-left: 10px;
		padding-right: 10px;
	}

	.menu {
		display: flex;
		flex-direction: column;
		max-width: 200px;
		min-width: 200px;
		width: 20%;
		padding-left: 10px;
		background-color: #444;
		height: calc(100vh - 100px);
	}

	.menu-item {
		flex: 1;
		background-color: #555;
		padding-left: 10px;
		padding-right: 10px;
	}

	.content {
		flex: 1;
		background-color: #666;
		height: calc(100vh - 100px);
		padding: 10px;
	}
</style>
