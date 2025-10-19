<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-background">
	<header class="border-b">
		<div class="container flex items-center justify-between py-4">
			<a href="/" class="text-xl font-bold">🔥 Svelte Tricks</a>
			<a href="/admin" class="text-sm font-medium hover:underline"
				>⚙️ Admin</a
			>
		</div>
	</header>

	<main class="container py-6">
		{@render children?.()}
	</main>

	<footer class="border-t py-6 text-center text-sm text-muted-foreground">
		{new Date().getFullYear()} &copy; Svelte Tricks
	</footer>
</div>
