<script>
</script>

<div class="container">
	<div class="header">
		<h1>Parts</h1>
	</div>
	<div class="menu">
		<div class="menu-item">
			<h2>item</h2>
			<h2>item</h2>
			<h2>item</h2>
		</div>
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
