<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<div class="min-h-screen bg-background">
	<header class="border-b">
		<div class="flex items-center justify-between py-4 px-4">
			<a href="/" class="text-xl font-bold">Svelte Tricks</a>
			<div class="flex items-center gap-4">
				<a href="/admin" class="text-sm font-medium hover:underline"
					>Admin</a
				>
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="py-6">
		{@render children?.()}
	</main>

	<footer class="border-t py-6 text-center text-sm text-muted-foreground">
		{new Date().getFullYear()} &copy; Svelte Tricks
	</footer>
</div>
