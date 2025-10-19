<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import "../app.css";
	import { ModeWatcher } from "mode-watcher";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";
	import { Button } from "$lib/components/ui/button";
	import { signout, isAuthenticated } from "$lib/api/auth.remote";

	let { children } = $props();
	let isAuth = $derived(await isAuthenticated());
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
				{#if isAuth}
					<a
						href="/admin"
						class="text-sm font-medium hover:underline"
					>
						Admin
					</a>
					<a
						href="/profile"
						class="text-sm font-medium hover:underline"
					>
						Profile
					</a>
					<form {...signout}>
						<Button type="submit" variant="outline">Sign out</Button
						>
					</form>
				{:else}
					<Button variant="outline" size="sm" href="/auth/login">
						Log in
					</Button>
					<Button variant="default" size="sm" href="/auth/signup">
						Sign up
					</Button>
				{/if}
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
