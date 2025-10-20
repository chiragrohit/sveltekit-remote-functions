<script lang="ts">
	import { signout, isAuthenticated } from "$lib/api/auth.remote";
	import { Button } from "$lib/components/ui/button";
	import ThemeToggle from "$lib/components/theme-toggle.svelte";

	let isAuth = $derived(await isAuthenticated());
</script>

<header class="border-b">
	<div class="flex items-center justify-between py-4 px-4">
		<a href="/" class="text-xl font-bold">CogniRivus</a>
		<div class="flex items-center gap-4">
			<a href="/feed" class="text-sm font-medium hover:underline">
				Feed
			</a>
			{#if isAuth}
				<a href="/blog" class="text-sm font-medium hover:underline">
					Blog
				</a>

				<a href="/admin" class="text-sm font-medium hover:underline">
					Admin
				</a>
				<a
					href="/dashboard/profile"
					class="text-sm font-medium hover:underline"
				>
					Profile
				</a>
				<a
					href="/dashboard"
					class="text-sm font-medium hover:underline"
				>
					Dashboard
				</a>

				<form {...signout}>
					<Button type="submit" variant="outline">Sign out</Button>
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
