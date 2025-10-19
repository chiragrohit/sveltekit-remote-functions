<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import Navbar from "$lib/components/navbar.svelte";
	import { page } from "$app/state";

	let { children } = $props();

	// Check if we're on the dashboard route
	let isDashboard = $derived(page.url.pathname.startsWith("/dashboard"));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<div class="min-h-screen bg-background">
	{#if !isDashboard}
		<Navbar />
	{/if}

	<main>
		{@render children?.()}
	</main>
</div>
