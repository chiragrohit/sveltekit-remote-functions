<script lang="ts">
	import SearchForm from "$lib/components/search-form.svelte";
	import { getAllPublicContents } from "$lib/api/feed.remote";
	import { onMount } from "svelte";
	import ContentCard from "$lib/components/content-card.svelte";
	import { authClient } from "$lib/auth-client";

	let contents = $state<any[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let currentUserId = $state<string | null>(null);

	// Function to fetch all public contents
	const fetchContents = async () => {
		isLoading = true;
		error = null;
		try {
			const response = await getAllPublicContents({
				limit: 20,
				offset: 0,
			});
			contents = response.contents;
		} catch (err) {
			error = "Failed to fetch public contents";
			console.error(err);
		} finally {
			isLoading = false;
		}
	};

	// Fetch contents when component mounts
	onMount(async () => {
		// Get current user ID (may be null if not logged in)
		const sessionData = await authClient.getSession();
		currentUserId = sessionData?.data?.user?.id || null;

		await fetchContents();
	});
</script>

<div class="flex flex-1 flex-col gap-6 p-6">
	<div class="text-center mb-8">
		<h1 class="text-3xl font-bold">Public Feed</h1>
		<p class="text-muted-foreground mt-2">
			Browse public content from our community
		</p>
	</div>

	<SearchForm />

	{#if isLoading}
		<div class="flex justify-center items-center h-32">
			<div
				class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
			></div>
		</div>
	{:else if error}
		<div
			class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
			role="alert"
		>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else}
		<div class="flex flex-wrap gap-6 items-center justify-center">
			{#each contents as content}
				<ContentCard {content} {currentUserId} />
			{:else}
				<div class="text-center py-8 w-full">
					<p class="text-gray-500">No public contents available</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
